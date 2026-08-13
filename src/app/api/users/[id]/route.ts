import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();

  const endUser = await db.endUser.findUnique({
    where: { id },
    include: {
      licenses: { orderBy: { createdAt: "desc" }, take: 10 },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
      _count: { select: { sessions: true, licenses: true, rewardCompletions: true } },
    },
  });
  if (!endUser || endUser.projectId !== projectId) return ApiError.notFound();
  return apiOk(endUser);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.action) return ApiError.badRequest("action required");
  if (!body?.projectId) return ApiError.badRequest("projectId required");
  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const endUser = await db.endUser.findUnique({ where: { id } });
  if (!endUser || endUser.projectId !== body.projectId) return ApiError.notFound();

  const action = body.action;
  if (action === "ban") {
    const updated = await db.endUser.update({ where: { id }, data: { status: "banned" } });
    await db.license.updateMany({ where: { endUserId: id }, data: { status: "banned" } });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.ban", target: id, ipAddress: getClientIp() });
    return apiOk(updated);
  }
  if (action === "unban") {
    const updated = await db.endUser.update({ where: { id }, data: { status: "active" } });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.unban", target: id, ipAddress: getClientIp() });
    return apiOk(updated);
  }
  if (action === "suspend") {
    const updated = await db.endUser.update({ where: { id }, data: { status: "suspended" } });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.suspend", target: id, ipAddress: getClientIp() });
    return apiOk(updated);
  }
  if (action === "unsuspend") {
    const updated = await db.endUser.update({ where: { id }, data: { status: "active" } });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.unsuspend", target: id, ipAddress: getClientIp() });
    return apiOk(updated);
  }
  if (action === "reset_hwid") {
    const updated = await db.endUser.update({
      where: { id },
      data: { hwid: null, hwidResetAt: new Date() },
    });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.hwid_reset", target: id, ipAddress: getClientIp() });
    return apiOk(updated);
  }
  if (action === "terminate_sessions") {
    await db.session.updateMany({
      where: { endUserId: id, status: { in: ["active", "idle"] } },
      data: { status: "terminated", terminatedAt: new Date() },
    });
    await audit({ actorId: user.id, projectId: body.projectId, action: "user.terminate_sessions", target: id, ipAddress: getClientIp() });
    return apiOk({ terminated: true });
  }
  return ApiError.badRequest("Unknown action");
}
