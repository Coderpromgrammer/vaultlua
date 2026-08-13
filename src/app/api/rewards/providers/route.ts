import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();

  const providers = await db.rewardProvider.findMany({
    where: { projectId },
    include: { checkpoints: { orderBy: { order: "asc" } } },
  });
  return apiOk(providers);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const provider = await db.rewardProvider.create({
    data: {
      projectId: body.projectId,
      name: String(body.name ?? "New Provider").slice(0, 80),
      type: body.type ?? "mock",
      enabled: true,
      rewardAmount: parseInt(body.rewardAmount ?? "1", 10) || 1,
      cooldownSec: parseInt(body.cooldownSec ?? "300", 10) || 300,
    },
  });
  await audit({
    actorId: user.id,
    projectId: body.projectId,
    action: "reward.provider.create",
    target: provider.id,
    metadata: { name: provider.name, type: provider.type },
    ipAddress: getClientIp(),
  });
  return apiOk(provider, 201);
}
