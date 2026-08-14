import { NextRequest } from "next/server";
import { loginWithCredentials, SESSION_COOKIE_NAME, SESSION_COOKIE_TTL } from "@/lib/session";
import { ApiError, apiOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return ApiError.badRequest();

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!username || !password) {
    return ApiError.badRequest("Username and password are required");
  }

  const token = await loginWithCredentials(username, password);
  if (!token) {
    return ApiError.unauthorized("Invalid username or password");
  }

  // Set the session cookie on the response
  const res = apiOk({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_COOKIE_TTL / 1000),
  });
  return res;
}
