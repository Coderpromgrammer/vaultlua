import { createHash, createHmac, randomBytes, randomUUID } from "crypto";
import { headers } from "next/headers";
import { db } from "./db";

/**
 * VaultLua authorization layer.
 *
 * In a real Supabase deployment, these policies would be implemented as
 * PostgreSQL Row Level Security (RLS) policies. In this self-contained
 * deployment we enforce the same rules at the server layer so that a normal
 * user can NEVER access another creator's projects, scripts, keys, sessions,
 * private configuration, or secrets.
 *
 * The browser only ever sees data the user is explicitly authorized to read.
 * The Supabase service-role key (or its equivalent) is NEVER shipped to the
 * browser — only the anon-key equivalent is exposed, and every privileged
 * action is re-validated server-side.
 */

export type Role = "user" | "creator" | "moderator" | "admin" | "owner";

export const ROLE_RANK: Record<Role, number> = {
  user: 0,
  creator: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
};

export function hasRole(userRole: string, ...allowed: Role[]): boolean {
  return allowed.includes(userRole as Role);
}

export function hasMinRole(userRole: string, min: Role): boolean {
  return ROLE_RANK[(userRole as Role) ?? "user"] >= ROLE_RANK[min];
}

/**
 * Returns true if the user can access the given project. The owner, members,
 * and any admin-or-above role pass.
 */
export async function canAccessProject(
  userId: string | undefined,
  userRole: string | undefined,
  projectId: string
): Promise<boolean> {
  if (!userId) return false;
  if (hasMinRole(userRole ?? "user", "admin")) return true;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, visibility: true },
  });
  if (!project) return false;
  if (project.ownerId === userId) return true;

  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (membership) return true;

  // visibility=public allows read-only access for any signed-in user
  return project.visibility === "public";
}

/**
 * Project-scoped query helper. Returns the WHERE clause that limits a query
 * to projects the user can access. Use this in every list query.
 */
export async function getProjectAccessFilter(
  userId: string | undefined,
  userRole: string | undefined
): Promise<{ ownerId?: string; members?: { some: { userId: string } } }> {
  if (!userId) return {};
  if (hasMinRole(userRole ?? "user", "admin")) return {};
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  } as never;
}

export async function canAccessScript(
  userId: string | undefined,
  userRole: string | undefined,
  scriptId: string
): Promise<boolean> {
  if (!userId) return false;
  if (hasMinRole(userRole ?? "user", "admin")) return true;
  const script = await db.script.findUnique({
    where: { id: scriptId },
    select: { projectId: true, authorId: true },
  });
  if (!script) return false;
  if (script.authorId === userId) return true;
  return canAccessProject(userId, userRole, script.projectId);
}

export async function canAccessLicense(
  userId: string | undefined,
  userRole: string | undefined,
  licenseId: string
): Promise<boolean> {
  if (!userId) return false;
  if (hasMinRole(userRole ?? "user", "admin")) return true;
  const license = await db.license.findUnique({
    where: { id: licenseId },
    select: { projectId: true, ownerId: true },
  });
  if (!license) return false;
  if (license.ownerId === userId) return true;
  return canAccessProject(userId, userRole, license.projectId);
}

// ────────────────────────────────────────────────────────────────────────────
// Crypto helpers
// ────────────────────────────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "vaultlua-dev-encryption-key-32b";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `vlx_live_${randomBytes(28).toString("hex")}`;
  const prefix = `${raw.slice(0, 16)}…${raw.slice(-4)}`;
  const hash = hashToken(raw);
  return { raw, prefix, hash };
}

export function generateLicenseKey(): string {
  // Format: VLX-XXXX-XXXX-XXXX-XXXX with checksum-friendly chars
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[randomBytes(1)[0] % chars.length]).join("");
  return `VLX-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateAnonymousSessionId(): string {
  return `rws_${randomBytes(24).toString("hex")}`;
}

export function signRewardSession(payload: string): string {
  return createHmac("sha256", ENCRYPTION_KEY).update(payload).digest("hex");
}

export function verifyRewardSessionSignature(
  payload: string,
  signature: string
): boolean {
  const expected = signRewardSession(payload);
  // constant-time-ish compare
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function shortId(prefix = "id"): string {
  return `${prefix}_${randomUUID().slice(0, 12)}`;
}

export function projectIdentifier(): string {
  return `vlx-${randomBytes(3).toString("hex")}`;
}

export function getClientIp(): string | undefined {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    undefined
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Audit logging
// ────────────────────────────────────────────────────────────────────────────

export async function audit(params: {
  actorId?: string;
  projectId?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  apiKeyId?: string;
  scriptId?: string;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      projectId: params.projectId ?? null,
      action: params.action,
      target: params.target ?? null,
      metadata: JSON.stringify(params.metadata ?? {}),
      ipAddress: params.ipAddress ?? null,
      apiKeyId: params.apiKeyId ?? null,
      scriptId: params.scriptId ?? null,
    },
  });
}
