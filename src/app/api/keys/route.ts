import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, hasMinRole, audit, getClientIp, generateLicenseKey } from "@/lib/authz";
import { ApiError, apiOk, apiPaginated } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const search = url.searchParams.get("search") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "20", 10), 100);

  if (!projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();

  const where = {
    projectId,
    ...(search ? { key: { contains: search } } : {}),
    ...(status ? { status } : {}),
  };
  const [total, items] = await Promise.all([
    db.license.count({ where }),
    db.license.findMany({
      where,
      include: {
        endUser: { select: { id: true, identifier: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return apiPaginated(items, { page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "creator")) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const count = Math.min(Math.max(parseInt(body.count ?? "1", 10) || 1, 1), 500);
  const durationDays = body.durationDays === null || body.durationDays === undefined
    ? null
    : Math.min(Math.max(parseInt(body.durationDays, 10) || 30, 1), 36500);
  const maxSessions = Math.min(Math.max(parseInt(body.maxSessions ?? "1", 10) || 1, 1), 10);
  const note = body.note ? String(body.note).slice(0, 500) : null;

  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 86400000)
    : null;

  const created = await Promise.all(
    Array.from({ length: count }, () =>
      db.license.create({
        data: {
          key: generateLicenseKey(),
          projectId: body.projectId,
          durationDays,
          expiresAt,
          status: "unclaimed",
          maxSessions,
          note,
        },
      })
    )
  );

  await audit({
    actorId: user.id,
    projectId: body.projectId,
    action: "key.create",
    target: body.projectId,
    metadata: { count, durationDays, maxSessions },
    ipAddress: getClientIp(),
  });

  return apiOk({ count: created.length, keys: created.map((k) => ({ id: k.id, key: k.key })) }, 201);
}
