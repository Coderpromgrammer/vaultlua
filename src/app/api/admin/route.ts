import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "admin")) return ApiError.forbidden();

  const [users, projects, scripts, sessions, rewardCompletions, errors] = await Promise.all([
    db.profile.count(),
    db.project.count({ where: { deletedAt: null } }),
    db.script.count({ where: { deletedAt: null } }),
    db.session.count({ where: { status: "active" } }),
    db.rewardCompletion.count({ where: { verified: true } }),
    db.auditLog.count({ where: { action: { contains: "error" } } }),
  ]);

  return apiOk({ users, projects, scripts, sessions, rewardCompletions, errors });
}
