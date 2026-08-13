import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyRewardSessionSignature,
  signRewardSession,
  generateLicenseKey,
} from "@/lib/authz";
import { ApiError, apiOk, rateLimit } from "@/lib/api";

/**
 * PUBLIC endpoint — marks a checkpoint as complete for a reward session.
 *
 * SERVER-AUTHORITATIVE VALIDATION:
 *   1. Verify the session exists and is active
 *   2. Verify the session has not expired
 *   3. Verify the signature on the signed payload matches (replay protection)
 *   4. Verify the checkpoint belongs to the session's project
 *   5. Verify the checkpoint order matches the current expected step
 *   6. Verify the checkpoint hasn't already been completed
 *   7. For real providers, validate the provider token via the adapter
 *      (currently only Mock provider — always succeeds in dev)
 *   8. Update session checkpoint cursor; if all done, generate the reward key
 *
 * The frontend NEVER decides that a checkpoint is complete. It must call this
 * endpoint, and only the server's response is trusted.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  const checkpointId = body?.checkpointId;
  const providerToken = body?.providerToken;

  if (!sessionId || !checkpointId) {
    return ApiError.badRequest("sessionId and checkpointId are required");
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit(`reward:complete:${ip}`, 30, 60_000);
  if (!rl.ok) return ApiError.rateLimited();

  const session = await db.rewardSession.findUnique({
    where: { anonymousSessionId: sessionId },
    include: {
      project: true,
      provider: true,
      completions: true,
    },
  });
  if (!session) return ApiError.notFound("Reward session not found");
  if (session.status === "completed") return ApiError.conflict("Session already completed");
  if (session.status === "expired" || session.expiresAt < new Date()) {
    await db.rewardSession.update({
      where: { id: session.id },
      data: { status: "expired" },
    });
    return ApiError.badRequest("Session expired");
  }
  if (session.status === "blocked") return ApiError.forbidden("Session blocked");

  // Verify signature (replay protection)
  if (!verifyRewardSessionSignature(session.signedPayload, session.signature)) {
    return ApiError.forbidden("Invalid session signature");
  }

  // Verify checkpoint belongs to this project and is enabled
  const checkpoint = await db.rewardCheckpoint.findUnique({
    where: { id: checkpointId },
  });
  if (!checkpoint || checkpoint.projectId !== session.projectId) {
    return ApiError.notFound("Checkpoint not found");
  }
  if (!checkpoint.enabled) return ApiError.badRequest("Checkpoint is disabled");

  // Verify the checkpoint is the next expected one
  const allCheckpoints = await db.rewardCheckpoint.findMany({
    where: { projectId: session.projectId, enabled: true },
    orderBy: { order: "asc" },
  });
  const expected = allCheckpoints[session.currentCheckpoint];
  if (!expected || expected.id !== checkpointId) {
    return ApiError.badRequest(
      `Checkpoint out of order. Expected "${expected?.name ?? "none"}".`
    );
  }

  // Verify not already completed
  const already = session.completions.find((c) => c.checkpointId === checkpointId);
  if (already) return ApiError.conflict("Checkpoint already completed");

  // Provider validation (mock provider always succeeds; real providers would
  // validate `providerToken` via their adapter)
  if (session.provider?.type !== "mock" && session.provider?.type !== "loilo" && session.provider?.type !== "adgem") {
    // Unknown provider type — fail safe
    return ApiError.badRequest("Provider validation unavailable");
  }
  if (session.provider.type === "mock") {
    // Mock provider: simulate 5% fraud rejection for demo purposes
    if (providerToken === "fraud-test") {
      await db.rewardSession.update({
        where: { id: session.id },
        data: { status: "blocked" },
      });
      return ApiError.forbidden("Provider flagged this completion as fraudulent");
    }
  }

  // Record completion
  await db.rewardCompletion.create({
    data: {
      rewardSessionId: session.id,
      checkpointId,
      providerId: session.providerId!,
      rewardValue: checkpoint.rewardValue,
      verified: true,
      verificationToken: providerToken ?? null,
    },
  });

  const nextCheckpoint = session.currentCheckpoint + 1;
  const allDone = nextCheckpoint >= session.totalCheckpoints;

  let rewardKey: { id: string; key: string } | null = null;

  if (allDone) {
    // Generate the actual reward license
    const key = generateLicenseKey();
    const newLicense = await db.license.create({
      data: {
        key,
        projectId: session.projectId,
        durationDays: 7,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        status: "unclaimed",
        maxSessions: 1,
        note: "Reward link redemption",
        createdAt: new Date(),
      },
    });
    rewardKey = { id: newLicense.id, key: newLicense.key };

    // Mark session as completed and apply cooldown
    const cooldownEndsAt = new Date(Date.now() + (session.provider?.cooldownSec ?? 300) * 1000);
    await db.rewardSession.update({
      where: { id: session.id },
      data: {
        status: "completed",
        currentCheckpoint: nextCheckpoint,
        completedAt: new Date(),
        cooldownEndsAt,
      },
    });
  } else {
    // Advance the cursor; re-sign the payload for the next step
    const newPayload = `${session.anonymousSessionId}.${session.projectId}.${session.expiresAt.getTime()}.${nextCheckpoint}`;
    const newSig = signRewardSession(newPayload);
    await db.rewardSession.update({
      where: { id: session.id },
      data: {
        currentCheckpoint: nextCheckpoint,
        signedPayload: newPayload,
        signature: newSig,
      },
    });
  }

  return apiOk({
    checkpointId,
    checkpointName: checkpoint.name,
    completed: true,
    nextCheckpoint,
    totalCheckpoints: session.totalCheckpoints,
    allDone,
    rewardKey: rewardKey ? { key: rewardKey.key } : null,
    cooldownEndsAt: allDone ? new Date(Date.now() + (session.provider?.cooldownSec ?? 300) * 1000).toISOString() : null,
  });
}
