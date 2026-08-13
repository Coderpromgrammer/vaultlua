import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessProject, hasMinRole, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk, apiPaginated } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "20", 10), 100);
  const search = url.searchParams.get("search") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const where = {
    AND: [
      hasMinRole(user.role, "admin")
        ? {}
        : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
      search
        ? {
            OR: [
              { name: { contains: search } },
              { identifier: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {},
      status ? { status } : {},
    ],
  } as never;

  const [total, items] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      include: {
        _count: {
          select: { scripts: true, licenses: true, members: true, sessions: true },
        },
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
  if (!hasMinRole(user.role, "creator")) return ApiError.forbidden("Creator role required");

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string" || body.name.length < 2) {
    return ApiError.badRequest("Project name is required (min 2 chars)");
  }

  const identifier = `vlx-${Math.random().toString(16).slice(2, 8)}`;
  const project = await db.project.create({
    data: {
      identifier,
      name: body.name,
      description: body.description ?? null,
      visibility: body.visibility === "public" ? "public" : "private",
      iconUrl: body.iconUrl ?? null,
      status: "active",
      ownerId: user.id,
    },
  });

  await audit({
    actorId: user.id,
    projectId: project.id,
    action: "project.create",
    target: project.id,
    metadata: { name: project.name, identifier: project.identifier },
    ipAddress: getClientIp(),
  });

  return apiOk(project, 201);
}
