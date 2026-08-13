import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  generateAnonymousSessionId,
  signRewardSession,
} from "@/lib/authz";
import { ApiError, apiOk, rateLimit } from "@/lib/api";

/**
 * PUBLIC endpoint — starts a reward session for a visitor.
 *
 * This is the entrypoint for the /ads flow. The visitor does NOT need to be
 * authenticated. We:
 *   1. Look up the project by its public token (identifier)
 *   2. Validate that rewards are enabled
 *   3. Create a signed, server-authoritative session with an expiration
 *   4. Return only the session ID + checkpoint metadata (never the signing key)
 *
 * The frontend is NEVER trusted to mark a checkpoint as complete. It must
 * call /api/rewards/complete with the signed session, and the server verifies
 * the signature, the cooldown, and (for real providers) the provider callback.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const projectToken = body?.projectToken;
  if (!projectToken || typeof projectToken !== "string") {
    return ApiError.badRequest("projectToken is required");
  }

  // Rate limit by IP to prevent session spam
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit(`reward:start:${ip}`, 10, 60_000);
  if (!rl.ok) return ApiError.rateLimited("Too many reward sessions. Try again in a minute.");

  const project = await db.project.findUnique({
    where: { identifier: projectToken },
    include: {
      rewardProviders: { where: { enabled: true }, take: 1 },
    },
  });
  if (!project || project.status !== "active") {
    return ApiError.notFound("Project not found or rewards not enabled");
  }
  const provider = project.rewardProviders[0];
  if (!provider) return ApiError.badRequest("No active reward provider");

  const checkpoints = await db.rewardCheckpoint.findMany({
    where: { projectId: project.id, enabled: true },
    orderBy: { order: "asc" },
  });
  if (checkpoints.length === 0) {
    return ApiError.badRequest("No checkpoints configured for this project");
  }

  // Cooldown check: if the same IP recently completed a reward, block
  const recentCompleted = await db.rewardSession.findFirst({
    where: {
      projectId: project.id,
      ipAddress: ip,
      status: "completed",
      cooldownEndsAt: { gt: new Date() },
    },
    orderBy: { cooldownEndsAt: "desc" },
  });
  if (recentCompleted) {
    return ApiError.conflict(
      `Cooldown active. Try again after ${recentCompleted.cooldownEndsAt?.toISOString()}`
    );
  }

  const sessionId = generateAnonymousSessionId();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  const payload = `${sessionId}.${project.id}.${expiresAt.getTime()}`;
  const signature = signRewardSession(payload);

  const session = await db.rewardSession.create({
    data: {
      projectId: project.id,
      providerId: provider.id,
      anonymousSessionId: sessionId,
      signedPayload: payload,
      currentCheckpoint: 0,
      totalCheckpoints: checkpoints.length,
      status: "active",
      signature,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? null,
      expiresAt,
    },
  });

  return apiOk({
    sessionId: session.anonymousSessionId,
    expiresAt: session.expiresAt,
    status: session.status,
    currentCheckpoint: session.currentCheckpoint,
    totalCheckpoints: session.totalCheckpoints,
    checkpoints: checkpoints.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
      rewardValue: c.rewardValue,
      provider: provider.name,
      providerType: provider.type,
    })),
    project: {
      id: project.id,
      name: project.name,
      identifier: project.identifier,
    },
  }, 201);
}
