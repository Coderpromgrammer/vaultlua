import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole } from "@/lib/authz";
import { ApiError, apiOk, apiPaginated } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "admin")) return ApiError.forbidden();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "50", 10), 200);
  const action = url.searchParams.get("action") ?? "";

  const where = action ? { action: { contains: action } } : {};
  const [total, items] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, username: true, displayName: true } },
        project: { select: { id: true, name: true, identifier: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return apiPaginated(
    items.map((i) => ({ ...i, metadata: JSON.parse(i.metadata) })),
    { page, pageSize, total }
  );
}
