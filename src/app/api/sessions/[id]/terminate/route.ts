import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;

  const session = await db.session.findUnique({
    where: { id },
    select: { id: true, projectId: true },
  });
  if (!session) return ApiError.notFound();

  // Re-check access via project
  const allowed = await canAccessSessionProject(user.id, user.role, session.projectId);
  if (!allowed) return ApiError.forbidden();

  const updated = await db.session.update({
    where: { id },
    data: { status: "terminated", terminatedAt: new Date() },
  });
  await audit({
    actorId: user.id,
    projectId: session.projectId,
    action: "session.terminate",
    target: id,
    metadata: { sessionToken: updated.sessionToken.slice(0, 12) + "…" },
    ipAddress: getClientIp(),
  });
  return apiOk(updated);
}

// Helper: project-level access check
async function canAccessSessionProject(
  userId: string | undefined,
  userRole: string | undefined,
  projectId: string
): Promise<boolean> {
  if (!userId) return false;
  if (userRole === "admin" || userRole === "owner") return true;
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, members: { where: { userId } } },
  });
  if (!project) return false;
  return project.ownerId === userId || project.members.length > 0;
}
