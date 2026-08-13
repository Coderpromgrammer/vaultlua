import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hasMinRole } from "@/lib/authz";
import { ApiError, apiOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "admin")) return ApiError.forbidden();

  const settings = await db.systemSetting.findMany();
  return apiOk(settings.reduce((acc, s) => {
    try {
      acc[s.key] = JSON.parse(s.value);
    } catch {
      acc[s.key] = s.value;
    }
    return acc;
  }, {} as Record<string, unknown>));
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  if (!hasMinRole(user.role, "admin")) return ApiError.forbidden();

  const body = await req.json().catch(() => null);
  if (!body?.key) return ApiError.badRequest("key required");

  const value = typeof body.value === "object" ? JSON.stringify(body.value) : String(body.value);
  const updated = await db.systemSetting.upsert({
    where: { key: body.key },
    update: { value },
    create: { key: body.key, value, scope: body.scope ?? "global" },
  });

  return apiOk({ key: updated.key, value: updated.value, scope: updated.scope });
}
