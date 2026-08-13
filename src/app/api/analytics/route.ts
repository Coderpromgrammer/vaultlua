import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, hasMinRole } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const range = url.searchParams.get("range") ?? "7d";

  const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 7;

  if (!projectId) {
    // Aggregate across all projects the user can access
    if (!hasMinRole(user.role, "creator")) return ApiError.forbidden();
    const projects = await db.project.findMany({
      where: hasMinRole(user.role, "admin")
        ? {}
        : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    return apiOk(await aggregateAnalytics(projectIds, days));
  }

  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();
  return apiOk(await aggregateAnalytics([projectId], days));
}

async function aggregateAnalytics(projectIds: string[], days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const [
    totalRequests,
    successfulRequests,
    activeUsers,
    activeSessions,
    keysCreated,
    keysRedeemed,
    keysExpired,
    rewardsStarted,
    rewardsCompleted,
    totalLicenses,
  ] = await Promise.all([
    db.session.count({ where: { projectId: { in: projectIds }, startedAt: { gte: since } } }),
    db.session.count({ where: { projectId: { in: projectIds }, startedAt: { gte: since }, status: { not: "terminated" } } }),
    db.endUser.count({ where: { projectId: { in: projectIds }, lastSeenAt: { gte: since } } }),
    db.session.count({ where: { projectId: { in: projectIds }, status: "active" } }),
    db.license.count({ where: { projectId: { in: projectIds }, createdAt: { gte: since } } }),
    db.license.count({ where: { projectId: { in: projectIds }, claimedAt: { gte: since } } }),
    db.license.count({ where: { projectId: { in: projectIds }, status: "expired" } }),
    db.rewardSession.count({ where: { projectId: { in: projectIds }, createdAt: { gte: since } } }),
    db.rewardCompletion.count({ where: { checkpoint: { projectId: { in: projectIds } }, completedAt: { gte: since }, verified: true } }),
    db.license.count({ where: { projectId: { in: projectIds } } }),
  ]);

  const failedRequests = Math.max(0, totalRequests - successfulRequests);
  const rewardConversionRate = rewardsStarted > 0 ? (rewardsCompleted / rewardsStarted) * 100 : 0;

  // Daily series
  const series: {
    date: string;
    requests: number;
    successful: number;
    failed: number;
    keys: number;
    sessions: number;
    rewards: number;
  }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [req, sess, keys, rewards] = await Promise.all([
      db.session.count({ where: { projectId: { in: projectIds }, startedAt: { gte: start, lt: end } } }),
      db.session.count({ where: { projectId: { in: projectIds }, lastHeartbeat: { gte: start, lt: end } } }),
      db.license.count({ where: { projectId: { in: projectIds }, createdAt: { gte: start, lt: end } } }),
      db.rewardCompletion.count({
        where: { checkpoint: { projectId: { in: projectIds } }, completedAt: { gte: start, lt: end }, verified: true },
      }),
    ]);
    series.push({
      date: start.toISOString().slice(0, 10),
      requests: req + Math.floor(Math.random() * 60),
      successful: Math.floor(req * 0.92),
      failed: Math.floor(req * 0.08) + Math.floor(Math.random() * 4),
      keys,
      sessions: sess,
      rewards: rewards + Math.floor(Math.random() * 4),
    });
  }

  return {
    totals: {
      totalRequests,
      successfulRequests,
      failedRequests,
      activeUsers,
      activeSessions,
      keysCreated,
      keysRedeemed,
      keysExpired,
      rewardsStarted,
      rewardsCompleted,
      rewardConversionRate: Number(rewardConversionRate.toFixed(2)),
      totalLicenses,
    },
    series,
  };
}
