import { db } from "./db";
import {
  generateLicenseKey,
  generateSessionToken,
  projectIdentifier,
} from "./authz";

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

/**
 * Seeds sample data for a real user. Called when the user clicks "Load sample
 * data" in the dashboard. No demo accounts are created — only projects, scripts,
 * keys, users, sessions, and rewards linked to the real user's ID.
 */
export async function seedSampleData(userId: string) {
  // Check if the user already has projects
  const existing = await db.project.count({ where: { ownerId: userId } });
  if (existing > 0) {
    return { seeded: false, reason: "User already has projects" };
  }

  // ── Project 1: Phantom Hub
  const p1 = await db.project.create({
    data: {
      identifier: projectIdentifier(),
      name: "Phantom Hub",
      description:
        "Premium Roblox automation suite covering the top 12 games. Active community of 18,000+ users.",
      visibility: "private",
      status: "active",
      ownerId: userId,
    },
  });

  // ── Project 2: Nebula Aim
  const p2 = await db.project.create({
    data: {
      identifier: projectIdentifier(),
      name: "Nebula Aim",
      description:
        "Modular aiming suite with projectile prediction, recoil compensation, and configurable smoothing.",
      visibility: "private",
      status: "active",
      ownerId: userId,
    },
  });

  const projects = [p1, p2];

  // Scripts
  let scriptIdx = 0;
  for (const project of projects) {
    const scriptCount = 2;
    for (let i = 0; i < scriptCount; i++) {
      const tpl = SCRIPTS[(scriptIdx + i) % SCRIPTS.length];
      const currentVersion = tpl.versions[tpl.versions.length - 1];
      const script = await db.script.create({
        data: {
          projectId: project.id,
          name: tpl.name,
          description: tpl.description,
          status: "published",
          currentVersion,
          lastPublishedAt: daysFromNow(-2),
          authorId: userId,
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
            publishedById: userId,
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

    // Discord integration (mock)
    await db.discordIntegration.create({
      data: {
        projectId: project.id,
        ownerId: userId,
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

  // Notifications
  const notes = [
    {
      type: "success",
      title: "Sample data loaded",
      message: "2 projects with scripts, keys, users, and sessions have been created for you.",
    },
    {
      type: "info",
      title: "Try the reward flow",
      message: "Visit /#/ads to try the public reward link flow with your projects.",
    },
    {
      type: "info",
      title: "API key ready",
      message: "Create an API key from the API tab to start integrating programmatically.",
    },
  ];
  for (let i = 0; i < notes.length; i++) {
    await db.notification.create({
      data: {
        userId,
        ...notes[i],
        metadata: JSON.stringify({}),
        read: false,
        createdAt: new Date(Date.now() - i * 60_000),
      },
    });
  }

  return { seeded: true, projectCount: projects.length };
}
