import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessLicense, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessLicense(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  const delta = parseInt(body?.daysDelta, 10);
  if (!delta || delta === 0 || Math.abs(delta) > 36500) {
    return ApiError.badRequest("daysDelta must be a non-zero integer");
  }

  const license = await db.license.findUnique({ where: { id } });
  if (!license) return ApiError.notFound();

  let newExpiresAt: Date | null;
  if (license.durationDays === null) {
    // lifetime — extension has no effect, but allow shortening to a fixed expiry
    if (delta > 0) return ApiError.badRequest("Cannot extend a lifetime key");
    newExpiresAt = new Date(Date.now() + delta * 86400000);
  } else if (!license.expiresAt) {
    newExpiresAt = new Date(Date.now() + delta * 86400000);
  } else {
    newExpiresAt = new Date(license.expiresAt.getTime() + delta * 86400000);
  }

  const updated = await db.license.update({
    where: { id },
    data: { expiresAt: newExpiresAt, status: newExpiresAt && newExpiresAt < new Date() ? "expired" : "active" },
  });
  await audit({
    actorId: user.id,
    projectId: license.projectId,
    action: "key.extend",
    target: id,
    metadata: { delta, newExpiresAt },
    ipAddress: getClientIp(),
  });
  return apiOk(updated);
}
