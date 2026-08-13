import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canAccessScript, audit, getClientIp } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const { id } = await params;
  const allowed = await canAccessScript(user.id, user.role, id);
  if (!allowed) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.version) return ApiError.badRequest("version is required");
  if (!/^\d+\.\d+\.\d+$/.test(body.version)) {
    return ApiError.badRequest("Version must be semver x.y.z");
  }
  if (!body.payload || typeof body.payload !== "string") {
    return ApiError.badRequest("payload is required");
  }

  const script = await db.script.findUnique({ where: { id } });
  if (!script) return ApiError.notFound();

  const existing = await db.scriptVersion.findUnique({
    where: { scriptId_version: { scriptId: id, version: body.version } },
  });
  if (existing) return ApiError.conflict("Version already exists");

  const payloadRef = `scripts/${id}/${body.version}.luau`;
  const version = await db.scriptVersion.create({
    data: {
      scriptId: id,
      version: body.version,
      changelog: body.changelog ?? null,
      payloadRef,
      payloadSize: body.payload.length,
      publishedById: user.id,
    },
  });

  await db.script.update({
    where: { id },
    data: { currentVersion: body.version, lastPublishedAt: new Date(), status: "published" },
  });

  await audit({
    actorId: user.id,
    projectId: script.projectId,
    action: "script.publish",
    target: id,
    metadata: { version: body.version, payloadSize: body.payload.length },
    ipAddress: getClientIp(),
  });

  return apiOk(version, 201);
}
