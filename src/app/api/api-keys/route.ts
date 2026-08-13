import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole, audit, getClientIp, generateApiKey } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "creator")) return ApiError.forbidden();

  const keys = await db.apiKey.findMany({
    where: { ownerId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  // Strip the hash, return safe view
  return apiOk(keys.map((k) => ({
    ...k,
    keyHash: undefined,
    permissions: JSON.parse(k.permissions),
  })));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "creator")) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.name) return ApiError.badRequest("name is required");
  const perms: string[] = Array.isArray(body.permissions) ? body.permissions : [];
  const validPerms = perms.filter((p) =>
    [
      "projects:read", "projects:write",
      "scripts:read", "scripts:write",
      "users:read", "users:write",
      "keys:read", "keys:write",
      "analytics:read",
    ].includes(p)
  );

  const { raw, prefix, hash } = generateApiKey();
  const created = await db.apiKey.create({
    data: {
      ownerId: user.id,
      name: String(body.name).slice(0, 60),
      keyPrefix: prefix,
      keyHash: hash,
      permissions: JSON.stringify(validPerms),
    },
  });

  await audit({
    actorId: user.id,
    action: "apikey.create",
    target: created.id,
    metadata: { name: created.name, permissions: validPerms },
    ipAddress: getClientIp(),
  });

  // The raw key is returned ONCE — never again.
  return apiOk({ id: created.id, name: created.name, keyPrefix: prefix, permissions: validPerms, rawKey: raw, createdAt: created.createdAt }, 201);
}
