import { NextRequest } from "next/server";
import { seedSampleData } from "@/lib/seed";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ApiError, apiOk } from "@/lib/api";

/**
 * Seeds sample data for the current authenticated user.
 * No demo accounts are created — only projects, scripts, keys, users, and
 * sessions linked to the real user's ID.
 */
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const result = await seedSampleData(user.id);
  return apiOk(result);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiOk({ hasProjects: false });
  const count = await db.project.count({ where: { ownerId: user.id } });
  return apiOk({ hasProjects: count > 0, projectCount: count });
}
