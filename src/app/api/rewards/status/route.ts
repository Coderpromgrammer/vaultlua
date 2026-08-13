import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, apiOk } from "@/lib/api";

/**
 * PUBLIC endpoint — fetches the current state of a reward session.
 * Used by the public /ads page to render checkpoint progress.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return ApiError.badRequest("sessionId is required");

  const session = await db.rewardSession.findUnique({
    where: { anonymousSessionId: sessionId },
    include: {
      project: { select: { id: true, name: true, identifier: true } },
      provider: { select: { id: true, name: true, type: true } },
      completions: { include: { checkpoint: true } },
    },
  });
  if (!session) return ApiError.notFound("Reward session not found");

  const checkpoints = await db.rewardCheckpoint.findMany({
    where: { projectId: session.projectId, enabled: true },
    orderBy: { order: "asc" },
  });

  return apiOk({
    sessionId: session.anonymousSessionId,
    status: session.status,
    currentCheckpoint: session.currentCheckpoint,
    totalCheckpoints: session.totalCheckpoints,
    expiresAt: session.expiresAt,
    completedAt: session.completedAt,
    cooldownEndsAt: session.cooldownEndsAt,
    project: session.project,
    provider: session.provider,
    checkpoints: checkpoints.map((c, i) => {
      const completion = session.completions.find((cp) => cp.checkpointId === c.id);
      return {
        id: c.id,
        name: c.name,
        order: c.order,
        rewardValue: c.rewardValue,
        state:
          completion ? "completed"
          : i === session.currentCheckpoint ? "current"
          : "locked",
      };
    }),
  });
}
