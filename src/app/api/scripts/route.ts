import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, hasMinRole, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk, apiPaginated } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "20", 10), 100);

  if (!projectId) return ApiError.badRequest("projectId is required");
  const allowed = await canAccessProject(user.id, user.role, projectId);
  if (!allowed) return ApiError.forbidden();

  const where = { projectId, deletedAt: null };
  const [total, items] = await Promise.all([
    db.script.count({ where }),
    db.script.findMany({
      where,
      include: { _count: { select: { sessions: true, versions: true } } },
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
  if (!body?.projectId || !body?.name) return ApiError.badRequest("projectId and name required");

  const allowed = await canAccessProject(user.id, user.role, body.projectId);
  if (!allowed) return ApiError.forbidden();

  const script = await db.script.create({
    data: {
      projectId: body.projectId,
      name: String(body.name).slice(0, 80),
      description: body.description ?? null,
      status: "draft",
      currentVersion: "0.0.0",
      authorId: user.id,
    },
  });
  await audit({
    actorId: user.id,
    projectId: body.projectId,
    action: "script.create",
    target: script.id,
    metadata: { name: script.name },
    ipAddress: getClientIp(),
  });
  return apiOk(script, 201);
}
