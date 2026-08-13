import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const provider = await db.rewardProvider.findFirst({
    where: { projectId: body.projectId },
  });
  if (!provider) return ApiError.badRequest("No provider configured for project");

  const order = parseInt(body.order ?? "0", 10) || 0;
  const checkpoint = await db.rewardCheckpoint.create({
    data: {
      projectId: body.projectId,
      providerId: provider.id,
      name: String(body.name ?? "New Checkpoint").slice(0, 80),
      order,
      enabled: body.enabled !== false,
      rewardValue: parseInt(body.rewardValue ?? "1", 10) || 1,
      cooldownSec: parseInt(body.cooldownSec ?? "60", 10) || 60,
      validationUrl: body.validationUrl ?? null,
    },
  });
  await audit({
    actorId: user.id,
    projectId: body.projectId,
    action: "reward.checkpoint.create",
    target: checkpoint.id,
    metadata: { name: checkpoint.name, order },
    ipAddress: getClientIp(),
  });
  return apiOk(checkpoint, 201);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.id) return ApiError.badRequest("id is required");
  const existing = await db.rewardCheckpoint.findUnique({ where: { id: body.id } });
  if (!existing) return ApiError.notFound();
  const allowed = await canAccessProject(user.id, user.role, existing.projectId);
  if (!allowed) return ApiError.forbidden();

  const updated = await db.rewardCheckpoint.update({
    where: { id: body.id },
    data: {
      ...(body.name && { name: String(body.name).slice(0, 80) }),
      ...(body.order !== undefined && { order: parseInt(body.order, 10) }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.rewardValue !== undefined && { rewardValue: parseInt(body.rewardValue, 10) }),
      ...(body.cooldownSec !== undefined && { cooldownSec: parseInt(body.cooldownSec, 10) }),
      ...(body.validationUrl !== undefined && { validationUrl: body.validationUrl }),
    },
  });
  return apiOk(updated);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return ApiError.badRequest("id is required");
  const existing = await db.rewardCheckpoint.findUnique({ where: { id } });
  if (!existing) return ApiError.notFound();
  const allowed = await canAccessProject(user.id, user.role, existing.projectId);
  if (!allowed) return ApiError.forbidden();

  await db.rewardCheckpoint.delete({ where: { id } });
  await audit({
    actorId: user.id,
    projectId: existing.projectId,
    action: "reward.checkpoint.delete",
    target: id,
    ipAddress: getClientIp(),
  });
  return apiOk({ deleted: true });
}
