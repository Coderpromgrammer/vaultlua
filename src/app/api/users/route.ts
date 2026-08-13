import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, audit, getClientIp } from "@/lib/authz";
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
    ...(search ? { identifier: { contains: search } } : {}),
    ...(status ? { status } : {}),
  };
  const [total, items] = await Promise.all([
    db.endUser.count({ where }),
    db.endUser.findMany({
      where,
      include: {
        _count: { select: { sessions: true, licenses: true } },
      },
      orderBy: { lastSeenAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return apiPaginated(items, { page, pageSize, total });
}
