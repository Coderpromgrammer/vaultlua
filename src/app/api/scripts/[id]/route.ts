import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessScript, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessScript(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const script = await db.script.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { publishedAt: "desc" } },
      _count: { select: { sessions: true } },
    },
  });
  if (!script) return ApiError.notFound();
  return apiOk(script);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessScript(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return ApiError.badRequest();

  const updated = await db.script.update({
    where: { id },
    data: {
      ...(body.name && { name: String(body.name).slice(0, 80) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
    },
  });
  await audit({
    actorId: user.id,
    projectId: updated.projectId,
    action: "script.update",
    target: id,
    metadata: body,
    ipAddress: getClientIp(),
  });
  return apiOk(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessScript(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  await db.script.update({ where: { id }, data: { deletedAt: new Date(), status: "disabled" } });
  await audit({
    actorId: user.id,
    action: "script.delete",
    target: id,
    ipAddress: getClientIp(),
  });
  return apiOk({ deleted: true });
}
