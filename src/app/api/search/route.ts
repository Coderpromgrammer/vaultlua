import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length < 2) return apiOk({ projects: [], scripts: [], users: [], keys: [], sessions: [] });

  const isAdmin = hasMinRole(user.role, "admin");
  const projectFilter = isAdmin
    ? {}
    : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };

  const [projects, scripts, endUsers, licenses, sessions] = await Promise.all([
    db.project.findMany({
      where: { ...projectFilter, name: { contains: q } },
      take: 5,
      select: { id: true, name: true, identifier: true, status: true },
    }),
    db.script.findMany({
      where: { project: projectFilter, name: { contains: q } },
      take: 5,
      select: { id: true, name: true, currentVersion: true, projectId: true },
    }),
    db.endUser.findMany({
      where: { project: projectFilter, identifier: { contains: q } },
      take: 5,
      select: { id: true, identifier: true, displayName: true, status: true, projectId: true },
    }),
    db.license.findMany({
      where: { project: projectFilter, key: { contains: q } },
      take: 5,
      select: { id: true, key: true, status: true, projectId: true },
    }),
    db.session.findMany({
      where: { project: projectFilter, sessionToken: { contains: q } },
      take: 5,
      select: { id: true, status: true, sessionToken: true, startedAt: true, projectId: true },
    }),
  ]);

  return apiOk({ projects, scripts, users: endUsers, keys: licenses, sessions });
}
