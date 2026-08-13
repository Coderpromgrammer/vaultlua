import { NextRequest } from "next/server";
import { seedDemoData } from "@/lib/seed";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

// Auto-seed on first deployment via this endpoint, or call from layout.
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  const profileCount = await db.profile.count();
  if (profileCount > 0) {
    if (!user || !hasMinRole(user.role, "admin")) {
      return ApiError.forbidden("Demo data already seeded. Admin role required to re-seed.");
    }
  }
  await seedDemoData();
  return apiOk({ seeded: true });
}

export async function GET() {
  const profileCount = await db.profile.count();
  return apiOk({ seeded: profileCount > 0, profiles: profileCount });
}
