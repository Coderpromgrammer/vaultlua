import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessLicense, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessLicense(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const license = await db.license.findUnique({
    where: { id },
    include: {
      endUser: true,
      project: { select: { id: true, name: true, identifier: true } },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
  if (!license) return ApiError.notFound();
  return apiOk(license);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessLicense(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const license = await db.license.update({
    where: { id },
    data: { status: "revoked" },
  });
  await audit({
    actorId: user.id,
    projectId: license.projectId,
    action: "key.revoke",
    target: id,
    metadata: { key: license.key.slice(0, 12) + "…" },
    ipAddress: getClientIp(),
  });
  return apiOk(license);
}
