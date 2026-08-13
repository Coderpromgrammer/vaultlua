import { db } from "./db";
import {
  generateLicenseKey,
  generateSessionToken,
  hashPassword,
  projectIdentifier,
} from "./authz";

const AVATAR_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

const SCRIPTS = [
  {
    name: "Pet Simulator X — Auto Farm",
    description:
      "Auto-farm module with anti-AFK, auto-hatch, and inventory optimization. Supports latest game patch.",
    versions: ["1.0.0", "1.1.0", "1.2.0"],
  },
  {
    name: "Blox Fruits — Sea Event Helper",
    description:
      "Detects sea events, alerts crew, auto-dodges, and tracks spawn cooldowns in real time.",
    versions: ["1.0.0", "1.0.1", "1.1.0", "1.2.0"],
  },
  {
    name: "Arsenal — Silent Aim",
    description:
      "Server-validated silent aim with projectile prediction. Bypasses standard Roblox hit validation.",
    versions: ["1.0.0"],
  },
  {
    name: "Murder Mystery 2 — ESP",
    description:
      "Visual ESP for murderer, sheriff, and innocents. Customizable render distance and color palette.",
    versions: ["1.0.0", "1.1.0"],
  },
];

const KEY_STATUSES = [
  "active",
  "active",
  "active",
  "active",
  "expired",
  "unclaimed",
  "banned",
  "suspended",
] as const;

const SESSION_STATUSES = ["active", "active", "active", "idle", "disconnected"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function minutesAgo(min: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - min);
  return d;
}

function randHwid(seed: number): string {
  const hex = "abcdef0123456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += hex[(seed * 7 + i * 13) % 16];
  return s;
}

export async function seedDemoData() {
  // Demo profiles
  const owner = await db.profile.upsert({
    where: { email: "owner@vaultlua.dev" },
    update: {},
    create: {
      id: "owner_demo",
      email: "owner@vaultlua.dev",
      username: "vaultowner",
      displayName: "Vault Owner",
      role: "owner",
      passwordHash: await hashPassword("vaultlua-demo"),
    },
  });

  const admin = await db.profile.upsert({
    where: { email: "admin@vaultlua.dev" },
    update: {},
    create: {
      id: "admin_demo",
      email: "admin@vaultlua.dev",
      username: "vaultadmin",
      displayName: "Vault Admin",
      role: "admin",
      passwordHash: await hashPassword("vaultlua-demo"),
    },
  });

  const dan = await db.profile.upsert({
    where: { email: "creator@vaultlua.dev" },
    update: {},
    create: {
      id: "creator_demo",
      email: "creator@vaultlua.dev",
      username: "creator_dan",
      displayName: "Dan — Creator",
      role: "creator",
      passwordHash: await hashPassword("vaultlua-demo"),
    },
  });

  const maya = await db.profile.upsert({
    where: { email: "creator2@vaultlua.dev" },
    update: {},
    create: {
      id: "creator2_demo",
      email: "creator2@vaultlua.dev",
      username: "creator_maya",
      displayName: "Maya — Creator",
      role: "creator",
      passwordHash: await hashPassword("vaultlua-demo"),
    },
  });

  // Avoid reseeding if projects already exist for Dan
  const existingDanProjects = await db.project.count({
    where: { ownerId: dan.id },
  });
  if (existingDanProjects > 0) return;

  // ── Project 1 (Dan): Phantom Hub
  const p1 = await db.project.create({
    data: {
      identifier: projectIdentifier(),
      name: "Phantom Hub",
      description:
        "Premium Roblox automation suite covering the top 12 games. Active community of 18,000+ users.",
      visibility: "private",
      status: "active",
      ownerId: dan.id,
      iconUrl: pick(AVATAR_COLORS, 0),
    },
  });

  // ── Project 2 (Dan): Nebula Aim
  const p2 = await db.project.create({
    data: {
      identifier: projectIdentifier(),
      name: "Nebula Aim",
      description:
        "Modular aiming suite with projectile prediction, recoil compensation, and configurable smoothing.",
      visibility: "private",
      status: "active",
      ownerId: dan.id,
      iconUrl: pick(AVATAR_COLORS, 1),
    },
  });

  // ── Project 3 (Maya): Sparkle Pet Helper
  const p3 = await db.project.create({
    data: {
      identifier: projectIdentifier(),
      name: "Sparkle Pet Helper",
      description:
        "Pet collection helper with auto-trade, auto-hatch, and rarity tracking across multiple games.",
      visibility: "public",
      status: "active",
      ownerId: maya.id,
      iconUrl: pick(AVATAR_COLORS, 2),
    },
  });

  const projects = [p1, p2, p3];

  // Scripts
  let scriptIdx = 0;
  for (const project of projects) {
    const scriptCount = 2 + (scriptIdx % 2);
    for (let i = 0; i < scriptCount; i++) {
      const tpl = SCRIPTS[(scriptIdx + i) % SCRIPTS.length];
      const currentVersion = tpl.versions[tpl.versions.length - 1];
      const script = await db.script.create({
        data: {
          projectId: project.id,
          name: tpl.name,
          description: tpl.description,
          status: i === 1 && scriptIdx === 1 ? "disabled" : "published",
          currentVersion,
          lastPublishedAt: daysFromNow(-2),
          authorId: project.ownerId,
        },
      });
      for (let v = 0; v < tpl.versions.length; v++) {
        await db.scriptVersion.create({
          data: {
            scriptId: script.id,
            version: tpl.versions[v],
            changelog:
              v === 0
                ? "Initial release."
                : v === tpl.versions.length - 1
                ? "Performance improvements, bug fixes, and new game-patch support."
                : "Stability improvements and minor bug fixes.",
            payloadRef: `scripts/${script.id}/${tpl.versions[v]}.luau`,
            payloadSize: 48_000 + v * 4_300,
            publishedById: project.ownerId,
            publishedAt: daysFromNow(-(tpl.versions.length - v) * 4),
          },
        });
      }
      scriptIdx++;
    }
  }

  // Licenses, users, sessions for each project
  for (const project of projects) {
    const scripts = await db.script.findMany({ where: { projectId: project.id } });

    // End users
    for (let u = 0; u < 22; u++) {
      const endUser = await db.endUser.create({
        data: {
          projectId: project.id,
          identifier: `user_${project.identifier}_${u}`,
          displayName: `User ${String(u + 1).padStart(3, "0")}`,
          hwid: u % 4 === 0 ? null : randHwid(u + 11),
          hwidResetAt: u % 6 === 0 ? minutesAgo(u * 30) : null,
          status: u % 9 === 0 ? "banned" : u % 7 === 0 ? "suspended" : "active",
          firstSeenAt: daysFromNow(-u),
          lastSeenAt: minutesAgo(u * 5 + 1),
          requestCount: 50 + u * 13,
        },
      });

      // Each user gets 1-2 licenses
      const licenseCount = u % 3 === 0 ? 2 : 1;
      for (let k = 0; k < licenseCount; k++) {
        const status = pick(KEY_STATUSES, u + k);
        const durationDays = u % 5 === 0 ? null : pick([1, 3, 7, 30, 90], u + k);
        const expiresAt = durationDays
          ? daysFromNow(status === "expired" ? -1 : durationDays)
          : null;
        const license = await db.license.create({
          data: {
            key: generateLicenseKey(),
            projectId: project.id,
            endUserId: endUser.id,
            durationDays,
            expiresAt,
            status,
            hwid: endUser.hwid,
            hwidResetAt: endUser.hwidResetAt,
            maxSessions: pick([1, 1, 1, 2, 3], u + k),
            claimedAt: status === "unclaimed" ? null : daysFromNow(-u),
            lastUsedAt: status === "active" ? minutesAgo(u) : null,
            createdAt: daysFromNow(-u - 1),
            note: k === 1 ? "Backup key — giveaway" : null,
          },
        });

        // Active sessions for active licenses
        if (status === "active" && u % 2 === 0) {
          const sCount = u % 3;
          for (let s = 0; s <= sCount; s++) {
            const sStatus = pick(SESSION_STATUSES, u + s);
            await db.session.create({
              data: {
                projectId: project.id,
                scriptId: scripts[s % scripts.length].id,
                licenseId: license.id,
                endUserId: endUser.id,
                status: sStatus,
                sessionToken: generateSessionToken(),
                deviceInfo: `Windows 11 / Roblox ${2200 + u}`,
                ipAddress: `10.0.${u % 255}.${s}`,
                startedAt: minutesAgo(u * 5 + s * 30),
                lastHeartbeat:
                  sStatus === "active"
                    ? minutesAgo(0)
                    : sStatus === "idle"
                    ? minutesAgo(3)
                    : minutesAgo(15),
                terminatedAt: sStatus === "disconnected" ? minutesAgo(8) : null,
              },
            });
          }
        }
      }
    }

    // Reward provider + checkpoints
    const provider = await db.rewardProvider.create({
      data: {
        projectId: project.id,
        name: "Mock Reward Provider",
        type: "mock",
        enabled: true,
        rewardAmount: 1,
        cooldownSec: 300,
      },
    });

    for (let c = 0; c < 3; c++) {
      await db.rewardCheckpoint.create({
        data: {
          projectId: project.id,
          providerId: provider.id,
          name: ["Checkpoint Alpha", "Checkpoint Beta", "Checkpoint Gamma"][c],
          order: c,
          enabled: true,
          rewardValue: 1,
          cooldownSec: 60,
        },
      });
    }

    // Reward sessions
    for (let r = 0; r < 8; r++) {
      const completed = r % 4 === 0;
      await db.rewardSession.create({
        data: {
          projectId: project.id,
          providerId: provider.id,
          anonymousSessionId: `rws_seed_${project.id}_${r}`,
          signedPayload: `seed-${r}`,
          currentCheckpoint: completed ? 3 : r % 3,
          totalCheckpoints: 3,
          status: completed ? "completed" : r % 5 === 0 ? "expired" : "active",
          signature: `sig_${project.id}_${r}`,
          ipAddress: `192.168.${r}.1`,
          userAgent: "Mozilla/5.0 (Windows NT 10.0)",
          createdAt: daysFromNow(-r),
          expiresAt: daysFromNow(1),
          completedAt: completed ? daysFromNow(-r) : null,
          cooldownEndsAt: completed ? daysFromNow(0) : null,
        },
      });
    }

    // Discord integration (mock)
    await db.discordIntegration.create({
      data: {
        projectId: project.id,
        ownerId: project.ownerId,
        guildId: `1234567890${project.id.slice(-3)}`,
        guildName: `${project.name} Community`,
        botConnected: project.id === p1.id,
        roleMappings: JSON.stringify([
          { licenseStatus: "active", roleId: "111", roleName: "Verified" },
          { licenseStatus: "expired", roleId: "222", roleName: "Expired" },
          { licenseStatus: "banned", roleId: "333", roleName: "Banned" },
        ]),
        notifyOnRedeem: true,
        notifyOnRevoke: true,
        notifyOnBan: false,
        status: project.id === p1.id ? "connected" : "pending",
      },
    });
  }

  // API keys for Dan
  await db.apiKey.create({
    data: {
      ownerId: dan.id,
      name: "Production CI",
      keyPrefix: "vlx_live_7f3a…9b21",
      keyHash: "seed-hash-1",
      permissions: JSON.stringify([
        "projects:read",
        "scripts:read",
        "keys:read",
        "keys:write",
        "analytics:read",
      ]),
      lastUsedAt: minutesAgo(2),
      lastUsedIp: "10.0.0.42",
    },
  });
  await db.apiKey.create({
    data: {
      ownerId: dan.id,
      name: "Internal Tools (read-only)",
      keyPrefix: "vlx_live_2c8e…5d77",
      keyHash: "seed-hash-2",
      permissions: JSON.stringify(["projects:read", "scripts:read", "analytics:read"]),
      lastUsedAt: daysFromNow(-1),
      lastUsedIp: "10.0.0.10",
    },
  });

  // Audit logs
  const actions = [
    { action: "auth.login", actorId: dan.id, target: null },
    { action: "project.create", actorId: dan.id, target: p1.id, projectId: p1.id },
    { action: "project.create", actorId: dan.id, target: p2.id, projectId: p2.id },
    { action: "project.create", actorId: maya.id, target: p3.id, projectId: p3.id },
    { action: "script.publish", actorId: dan.id, target: null, projectId: p1.id },
    { action: "key.create", actorId: dan.id, target: null, projectId: p1.id },
    { action: "key.revoke", actorId: admin.id, target: null, projectId: p1.id },
    { action: "session.terminate", actorId: admin.id, target: null, projectId: p1.id },
    { action: "hwid.reset", actorId: dan.id, target: null, projectId: p1.id },
    { action: "apikey.create", actorId: dan.id, target: null },
    { action: "discord.connect", actorId: dan.id, target: null, projectId: p1.id },
    { action: "settings.update", actorId: owner.id, target: null },
  ];
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    await db.auditLog.create({
      data: {
        ...a,
        metadata: JSON.stringify({ source: "seed" }),
        ipAddress: "10.0.0.1",
        createdAt: minutesAgo(i * 30 + 5),
      },
    });
  }

  // Notifications for Dan
  const notes = [
    {
      type: "success",
      title: "Script published",
      message: "Pet Simulator X — Auto Farm v1.2.0 is now live for all license holders.",
    },
    {
      type: "warning",
      title: "Suspicious activity",
      message: "User user_vlx-7f3a_3 reset HWID 4 times in 24h. Review recommended.",
    },
    {
      type: "error",
      title: "Reward provider error",
      message: "Mock Reward Provider returned 503 for checkpoint Beta. Retrying.",
    },
    {
      type: "info",
      title: "API rate limit",
      message: "Production CI key is at 78% of hourly rate limit (780/1000).",
    },
    {
      type: "info",
      title: "Key expiration wave",
      message: "142 keys will expire in the next 7 days. Consider notifying users.",
    },
    {
      type: "warning",
      title: "Discord integration",
      message: "Bot connection lost for project 'Nebula Aim'. Re-auth required.",
    },
  ];
  for (let i = 0; i < notes.length; i++) {
    await db.notification.create({
      data: {
        userId: dan.id,
        ...notes[i],
        metadata: JSON.stringify({ createdAt: minutesAgo(i * 15) }),
        read: i > 3,
        createdAt: minutesAgo(i * 15 + 2),
      },
    });
  }

  // System settings
  await db.systemSetting.upsert({
    where: { key: "pricing.starter" },
    update: {},
    create: {
      key: "pricing.starter",
      value: JSON.stringify({ monthly: 9, yearly: 90, projects: 3, keys: 500, sessions: 500 }),
      scope: "pricing",
    },
  });
  await db.systemSetting.upsert({
    where: { key: "pricing.pro" },
    update: {},
    create: {
      key: "pricing.pro",
      value: JSON.stringify({ monthly: 29, yearly: 290, projects: 25, keys: 10000, sessions: 20000 }),
      scope: "pricing",
    },
  });
  await db.systemSetting.upsert({
    where: { key: "pricing.scale" },
    update: {},
    create: {
      key: "pricing.scale",
      value: JSON.stringify({ monthly: 99, yearly: 990, projects: -1, keys: -1, sessions: -1 }),
      scope: "pricing",
    },
  });
  await db.systemSetting.upsert({
    where: { key: "maintenance.enabled" },
    update: {},
    create: { key: "maintenance.enabled", value: "false", scope: "maintenance" },
  });
  await db.systemSetting.upsert({
    where: { key: "feature.discord_bot" },
    update: {},
    create: { key: "feature.discord_bot", value: "true", scope: "feature_flag" },
  });
  await db.systemSetting.upsert({
    where: { key: "feature.reward_links" },
    update: {},
    create: { key: "feature.reward_links", value: "true", scope: "feature_flag" },
  });
}
