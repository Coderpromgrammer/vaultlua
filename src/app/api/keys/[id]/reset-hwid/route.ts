import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessLicense, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessLicense(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const license = await db.license.update({
    where: { id },
    data: {
      hwid: null,
      hwidResetAt: new Date(),
      hwidResets: { increment: 1 },
    },
  });
  await audit({
    actorId: user.id,
    projectId: license.projectId,
    action: "hwid.reset",
    target: id,
    metadata: { key: license.key.slice(0, 12) + "…", totalResets: license.hwidResets },
    ipAddress: getClientIp(),
  });
  return apiOk(license);
}
