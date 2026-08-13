import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ApiError, apiOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  return apiOk({ items: notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const body = await req.json().catch(() => null);
  if (body?.markAllRead) {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return apiOk({ markedAllRead: true });
  }
  if (body?.id) {
    await db.notification.update({
      where: { id: body.id },
      data: { read: body.read ?? true },
    });
    return apiOk({ updated: true });
  }
  return ApiError.badRequest();
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    await db.notification.delete({ where: { id, userId: user.id } });
  } else {
    await db.notification.deleteMany({ where: { userId: user.id, read: true } });
  }
  return apiOk({ deleted: true });
}
