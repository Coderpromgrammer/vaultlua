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

  const integration = await db.discordIntegration.findFirst({
    where: { projectId },
  });
  return apiOk(integration ? {
    ...integration,
    roleMappings: JSON.parse(integration.roleMappings),
  } : null);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (!body?.projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const existing = await db.discordIntegration.findFirst({ where: { projectId: body.projectId } });

  const data = {
    guildId: body.guildId ?? null,
    guildName: body.guildName ?? null,
    roleMappings: JSON.stringify(body.roleMappings ?? []),
    notifyOnRedeem: body.notifyOnRedeem ?? true,
    notifyOnRevoke: body.notifyOnRevoke ?? true,
    notifyOnBan: body.notifyOnBan ?? false,
    webhookUrl: body.webhookUrl ?? null,
    status: existing?.status === "connected" ? "connected" : "pending",
  };

  const integration = existing
    ? await db.discordIntegration.update({ where: { id: existing.id }, data })
    : await db.discordIntegration.create({
        data: { ...data, projectId: body.projectId, ownerId: user.id } as never,
      });

  await audit({
    actorId: user.id,
    projectId: body.projectId,
    action: "discord.update",
    target: integration.id,
    metadata: { guildName: data.guildName },
    ipAddress: getClientIp(),
  });

  return apiOk({ ...integration, roleMappings: JSON.parse(integration.roleMappings) });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();

  await db.discordIntegration.deleteMany({ where: { projectId } });
  await audit({
    actorId: user.id,
    projectId,
    action: "discord.disconnect",
    ipAddress: getClientIp(),
  });
  return apiOk({ disconnected: true });
}
