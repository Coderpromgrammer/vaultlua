import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessLicense, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

const VALID_ACTIONS = ["ban", "unban", "suspend", "unsuspend"] as const;
type Action = (typeof VALID_ACTIONS)[number];

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
  if (!body?.action || !VALID_ACTIONS.includes(body.action)) {
    return ApiError.badRequest("Invalid action");
  }
  const action = body.action as Action;
  const newStatus =
    action === "ban" ? "banned"
    : action === "suspend" ? "suspended"
    : action === "unban" || action === "unsuspend" ? "active"
    : "active";

  const license = await db.license.update({ where: { id }, data: { status: newStatus } });
  await audit({
    actorId: user.id,
    projectId: license.projectId,
    action: `key.${action}`,
    target: id,
    metadata: { key: license.key.slice(0, 12) + "…", newStatus },
    ipAddress: getClientIp(),
  });
  return apiOk(license);
}
