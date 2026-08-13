import { z } from "zod";

export const permissionsSchema = z.array(
  z.enum([
    "projects:read",
    "projects:write",
    "scripts:read",
    "scripts:write",
    "users:read",
    "users:write",
    "keys:read",
    "keys:write",
    "analytics:read",
  ])
);

export const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "private"]).default("private"),
  iconUrl: z.string().url().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createScriptSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "published", "disabled"]).default("draft"),
});

export const publishScriptSchema = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must be semver x.y.z"),
  changelog: z.string().max(2000).optional(),
  payload: z.string().min(1).max(2_000_000), // 2 MB cap
});

export const createKeySchema = z.object({
  projectId: z.string().min(1),
  count: z.number().int().min(1).max(500).default(1),
  durationDays: z.number().int().positive().nullable(),
  maxSessions: z.number().int().min(1).max(10).default(1),
  note: z.string().max(500).optional(),
});

export const keyActionSchema = z.object({
  action: z.enum([
    "revoke",
    "ban",
    "unban",
    "suspend",
    "unsuspend",
    "reset_hwid",
  ]),
});

export const extendKeySchema = z.object({
  daysDelta: z.number().int().refine((v) => v !== 0, "Must be non-zero"),
});

export const transferKeySchema = z.object({
  newOwnerId: z.string().min(1),
});

export const createUserSchema = z.object({
  projectId: z.string().min(1),
  identifier: z.string().min(1).max(120),
  displayName: z.string().max(120).optional(),
});

export const userActionSchema = z.object({
  action: z.enum(["ban", "unban", "suspend", "unsuspend", "reset_hwid", "terminate_sessions"]),
});

export const createApiKeySchema = z.object({
  name: z.string().min(2).max(60),
  permissions: permissionsSchema,
});

export const updateCheckpointSchema = z.object({
  name: z.string().min(1).max(80),
  order: z.number().int().min(0),
  enabled: z.boolean().default(true),
  rewardValue: z.number().int().min(0).default(1),
  cooldownSec: z.number().int().min(0).default(60),
  validationUrl: z.string().url().optional().or(z.literal("")),
});

export const createProviderSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2).max(80),
  type: z.enum(["mock", "loilo", "adgem", "custom"]).default("mock"),
  rewardAmount: z.number().int().min(1).default(1),
  cooldownSec: z.number().int().min(0).default(300),
});

export const rewardStartSchema = z.object({
  projectToken: z.string().min(1),
});

export const rewardCheckpointSchema = z.object({
  sessionId: z.string().min(1),
  checkpointId: z.string().min(1),
  providerToken: z.string().optional(),
});

export const discordIntegrationSchema = z.object({
  guildId: z.string().optional().or(z.literal("")),
  roleMappings: z.array(
    z.object({
      licenseStatus: z.enum(["active", "expired", "banned", "revoked"]),
      roleId: z.string(),
      roleName: z.string(),
    })
  ),
  notifyOnRedeem: z.boolean().default(true),
  notifyOnRevoke: z.boolean().default(true),
  notifyOnBan: z.boolean().default(false),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(80).optional(),
  username: z.string().min(3).max(40).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});
