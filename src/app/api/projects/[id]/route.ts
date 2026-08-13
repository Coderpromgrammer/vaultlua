import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, hasMinRole, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      members: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
      },
      _count: {
        select: {
          scripts: true,
          licenses: true,
          sessions: true,
          rewardSessions: true,
        },
      },
    },
  });
  if (!project) return ApiError.notFound("Project not found");

  const canAccess =
    hasMinRole(user.role, "admin") ||
    project.ownerId === user.id ||
    project.members.some((m) => m.userId === user.id) ||
    project.visibility === "public";
  if (!canAccess) return ApiError.forbidden();

  return apiOk(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;

  const allowed = await canAccessProject(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return ApiError.badRequest();

  const updated = await db.project.update({
    where: { id },
    data: {
      ...(body.name && { name: String(body.name).slice(0, 80) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.visibility && { visibility: body.visibility }),
      ...(body.iconUrl !== undefined && { iconUrl: body.iconUrl }),
      ...(body.status && { status: body.status }),
    },
  });

  await audit({
    actorId: user.id,
    projectId: id,
    action: "project.update",
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

  const project = await db.project.findUnique({ where: { id }, select: { ownerId: true } });
  if (!project) return ApiError.notFound();
  if (project.ownerId !== user.id && !hasMinRole(user.role, "admin")) {
    return ApiError.forbidden();
  }

  await db.project.update({ where: { id }, data: { deletedAt: new Date(), status: "archived" } });
  await audit({
    actorId: user.id,
    projectId: id,
    action: "project.delete",
    target: id,
    ipAddress: getClientIp(),
  });

  return apiOk({ deleted: true });
}
