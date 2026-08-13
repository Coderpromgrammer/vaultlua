import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { audit, getClientIp, generateApiKey } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;

  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== user.id) return ApiError.notFound();

  // Revoke old, issue new
  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  const { raw, prefix, hash } = generateApiKey();
  const rotated = await db.apiKey.create({
    data: {
      ownerId: user.id,
      name: existing.name + " (rotated)",
      keyPrefix: prefix,
      keyHash: hash,
      permissions: existing.permissions,
    },
  });

  await audit({
    actorId: user.id,
    action: "apikey.rotate",
    target: id,
    metadata: { newId: rotated.id },
    ipAddress: getClientIp(),
  });

  return apiOk({
    id: rotated.id,
    name: rotated.name,
    keyPrefix: prefix,
    permissions: JSON.parse(rotated.permissions),
    rawKey: raw,
    createdAt: rotated.createdAt,
  }, 201);
}
