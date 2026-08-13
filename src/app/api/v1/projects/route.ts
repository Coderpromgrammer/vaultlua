import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken, hasMinRole, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk, apiPaginated } from "@/lib/api";

/**
 * VaultLua public REST API — v1
 *
 * Authentication: Bearer token (API key created from the dashboard).
 * The key is hashed on creation; we hash the incoming token and look it up.
 *
 * Permissions are granular and enforced per-endpoint:
 *   projects:read / projects:write
 *   scripts:read / scripts:write
 *   users:read / users:write
 *   keys:read / keys:write
 *   analytics:read
 */

export interface ApiAuthContext {
  apiKeyId: string;
  ownerId: string;
  permissions: string[];
  ip: string;
}

export async function authenticateApi(
  req: NextRequest,
  requiredPermission: string
): Promise<ApiAuthContext | Response> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return ApiError.unauthorized("Missing Bearer token");

  const hash = hashToken(token);
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      ownerId: true,
      permissions: true,
      revokedAt: true,
    },
  });
  if (!apiKey || apiKey.revokedAt) return ApiError.unauthorized("Invalid or revoked API key");

  const permissions: string[] = JSON.parse(apiKey.permissions);
  if (!permissions.includes(requiredPermission)) {
    return ApiError.forbidden(`Missing required permission: ${requiredPermission}`);
  }

  // Update last used
  const ip = getClientIp() ?? "0.0.0.0";
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date(), lastUsedIp: ip },
  });

  return { apiKeyId: apiKey.id, ownerId: apiKey.ownerId, permissions, ip };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateApi(req, "projects:read");
  if (auth instanceof Response) return auth;
  const ctx = auth as ApiAuthContext;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "20", 10), 100);

  const where = hasMinRole("creator", "admin")
    ? {}
    : { OR: [{ ownerId: ctx.ownerId }, { members: { some: { userId: ctx.ownerId } } }] };

  const [total, items] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      select: {
        id: true,
        identifier: true,
        name: true,
        description: true,
        status: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  await audit({
    actorId: ctx.ownerId,
    action: "api.projects.list",
    apiKeyId: ctx.apiKeyId,
    ipAddress: ctx.ip,
    metadata: { page, pageSize },
  });

  return apiPaginated(items, { page, pageSize, total });
}
