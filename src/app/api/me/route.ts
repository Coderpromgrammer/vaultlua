import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ApiError, apiOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const profile = await db.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      lastSeenAt: true,
      createdAt: true,
      _count: {
        select: {
          ownedProjects: true,
          apiKeys: true,
          auditLogs: true,
          notifications: true,
        },
      },
    },
  });
  if (!profile) return ApiError.notFound();
  return apiOk(profile);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (!body) return ApiError.badRequest();

  const updated = await db.profile.update({
    where: { id: user.id },
    data: {
      ...(body.displayName !== undefined && { displayName: String(body.displayName).slice(0, 80) || null }),
      ...(body.username && { username: String(body.username).slice(0, 40) }),
      ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl || null }),
    },
  });
  return apiOk(updated);
}
