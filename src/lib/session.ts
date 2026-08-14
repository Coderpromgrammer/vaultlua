import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";
import type { Role } from "./authz";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

/**
 * Simple single-account auth.
 *
 * Credentials are read from ADMIN_USERNAME / ADMIN_PASSWORD env vars
 * (defaults: admin / vaultlua2024). On first successful login, a Profile row
 * is created with role "owner" so existing API routes (which expect
 * user.id to be a Profile.id) work unchanged.
 *
 * Sessions are signed JWTs stored in an httpOnly cookie named "vlx_session".
 * No external auth provider — just enough to gate the dashboard.
 */

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vaultlua2024";
const SIGNING_KEY = process.env.ENCRYPTION_KEY || "vaultlua-dev-encryption-key-32b";
const COOKIE_NAME = "vlx_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(s: string): string {
  return Buffer.from(s).toString("base64url");
}
function base64UrlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString();
}

function sign(payload: string): string {
  return createHmac("sha256", SIGNING_KEY).update(payload).digest("base64url");
}

function makeJwt(payload: object): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function verifyJwt(token: string): Record<string, unknown> | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(body));
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Verify username/password and return a JWT to store in a cookie.
 * Returns null on failure.
 */
export async function loginWithCredentials(
  username: string,
  password: string
): Promise<string | null> {
  if (!safeEqual(username.trim().toLowerCase(), ADMIN_USERNAME.toLowerCase())) {
    return null;
  }
  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return null;
  }
  // Ensure a Profile exists for the admin user
  let profile = await db.profile.findFirst({
    where: { username: ADMIN_USERNAME },
  });
  if (!profile) {
    profile = await db.profile.create({
      data: {
        email: `${ADMIN_USERNAME}@vaultlua.local`,
        username: ADMIN_USERNAME,
        displayName: "Administrator",
        role: "owner",
      },
    });
  } else if (profile.role !== "owner") {
    profile = await db.profile.update({
      where: { id: profile.id },
      data: { role: "owner" },
    });
  }

  return makeJwt({
    sub: profile.id,
    u: ADMIN_USERNAME,
    exp: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Returns the current authenticated user by reading the session cookie.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp !== "number" || exp < Date.now()) return null;

  const profileId = payload.sub;
  if (typeof profileId !== "string") return null;

  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile) return null;

  // Touch lastSeenAt
  await db.profile
    .update({
      where: { id: profile.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role as Role,
  };
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.profile.findUnique({ where: { id: user.id } });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_TTL = SESSION_TTL_MS;
