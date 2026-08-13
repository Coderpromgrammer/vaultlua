import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { audit, getClientIp, generateApiKey } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;

  const key = await db.apiKey.findUnique({ where: { id } });
  if (!key || key.ownerId !== user.id) return ApiError.notFound();

  const revoked = await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  await audit({
    actorId: user.id,
    action: "apikey.revoke",
    target: id,
    metadata: { name: key.name },
    ipAddress: getClientIp(),
  });
  return apiOk({ revoked: true, id: revoked.id });
}
