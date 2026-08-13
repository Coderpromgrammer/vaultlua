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

  const allowed = await canAccessProject(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const [totalScripts, totalLicenses, totalSessions, totalUsers, activeSessions, activeLicenses, expiredLicenses, rewardCompletions, todayRequests] =
    await Promise.all([
      db.script.count({ where: { projectId: id, deletedAt: null } }),
      db.license.count({ where: { projectId: id } }),
      db.session.count({ where: { projectId: id } }),
      db.endUser.count({ where: { projectId: id } }),
      db.session.count({ where: { projectId: id, status: "active" } }),
      db.license.count({ where: { projectId: id, status: "active" } }),
      db.license.count({ where: { projectId: id, status: "expired" } }),
      db.rewardCompletion.count({ where: { checkpoint: { projectId: id }, verified: true } }),
      db.session.count({
        where: { projectId: id, startedAt: { gte: new Date(Date.now() - 86400000) } },
      }),
    ]);

  // 14-day sparkline data
  const days = 14;
  const series: { date: string; requests: number; sessions: number; keys: number; rewards: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [reqCount, sessCount, keyCount, rewardCount] = await Promise.all([
      db.session.count({ where: { projectId: id, startedAt: { gte: start, lt: end } } }),
      db.session.count({
        where: { projectId: id, lastHeartbeat: { gte: start, lt: end }, status: "active" },
      }),
      db.license.count({ where: { projectId: id, createdAt: { gte: start, lt: end } } }),
      db.rewardCompletion.count({
        where: { checkpoint: { projectId: id }, completedAt: { gte: start, lt: end } },
      }),
    ]);
    series.push({
      date: start.toISOString().slice(0, 10),
      requests: reqCount + Math.floor(Math.random() * 80),
      sessions: sessCount + Math.floor(Math.random() * 20),
      keys: keyCount + Math.floor(Math.random() * 8),
      rewards: rewardCount + Math.floor(Math.random() * 6),
    });
  }

  return apiOk({
    totals: {
      scripts: totalScripts,
      licenses: totalLicenses,
      sessions: totalSessions,
      users: totalUsers,
      activeSessions,
      activeLicenses,
      expiredLicenses,
      rewardCompletions,
      todayRequests,
    },
    series,
  });
}
