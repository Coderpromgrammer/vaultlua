import { SESSION_COOKIE_NAME } from "@/lib/session";
import { apiOk } from "@/lib/api";

export async function POST() {
  const res = apiOk({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
