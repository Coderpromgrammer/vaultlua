# VaultLua

**Protect, license and distribute your Roblox scripts.**

VaultLua is a production-grade developer infrastructure platform for licensing, protecting, and distributing Roblox Lua/Luau scripts. It handles the entire lifecycle of a script product — from versioned source delivery, to license key generation and validation, to real-time session monitoring, reward-link distribution, and analytics.

> **Note:** VaultLua is an original product. It is functionally comparable to platforms like Luarmor and Lua Aegis, but uses its own branding, UI, components, database schema, and backend. No third-party source code, trademarks, or proprietary assets are used.

---

## ✨ Features

### Core
- **Script Protection** — Server-side delivery keeps source out of the browser. Clients receive only authorized payloads after license, HWID, and session validation.
- **License Keys** — Generate single or batch keys with durations from 1 day to lifetime. Revoke, ban, suspend, extend, shorten, transfer, or reset HWID at any time.
- **HWID Binding** — Privacy-conscious device binding with reset cooldowns, history, and administrator override.
- **Live Sessions** — Real-time session tracking with heartbeats. Terminate any session, inspect device info, or kill all sessions for a user.
- **Reward Links** — Ad-gated reward flows with checkpoint progression, provider adapters, and **server-authoritative** completion.
- **Analytics** — 24h / 7d / 30d / 90d ranges. Track requests, sessions, keys, rewards, and conversion rates.
- **REST API** — Bearer-token API with granular per-resource permissions.
- **Discord Integration** — Auto-assign roles on key redemption, remove on revocation, optional ban sync.

### Platform
- 🔐 Server-authoritative security model — browser never sees your secrets
- 🎨 Dark + **Light** themes with smooth modern gradients (system-aware, no flash of incorrect theme)
- ⚡ Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui
- 🗄️ Prisma schema with 20+ tables (mirrors Supabase PostgreSQL 1:1)
- 🔑 NextAuth credentials provider (4 demo accounts)
- 🛡️ RLS-equivalent authorization layer enforced server-side
- 📋 Audit logging on every privileged action
- ⌘ Command palette (Ctrl/Cmd+K)
- 📱 Fully responsive — desktop, tablet, mobile

---

## 🚀 Quick start

### Prerequisites
- Node.js 20+ or [Bun](https://bun.sh) 1.1+
- A Supabase project (optional — SQLite works for local dev)

### Install & run

```bash
# 1. Install dependencies
bun install

# 2. Copy env template and fill in real values
cp .env.example .env
# (Edit .env — at minimum set NEXTAUTH_SECRET and ENCRYPTION_KEY)

# 3. Push the database schema
bun run db:push

# 4. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a demo account:

| Role    | Email                    | Password         |
|---------|--------------------------|------------------|
| Owner   | owner@vaultlua.dev       | vaultlua-demo    |
| Admin   | admin@vaultlua.dev       | vaultlua-demo    |
| Creator | creator@vaultlua.dev     | vaultlua-demo    |
| Creator | creator2@vaultlua.dev    | vaultlua-demo    |

Demo data is auto-seeded on first run (3 projects, scripts with versions, ~66 licenses, ~22 end users per project, sessions, reward providers + checkpoints, API keys, audit logs, notifications).

### Try the public reward flow

1. Visit `/#/ads`
2. Click **Load a demo project** (auto-fills the project token)
3. Click **Start reward flow**
4. Click **Complete** on each of the 3 checkpoints
5. Receive a real license key (saved to the database)

The flow is fully server-authoritative: HMAC-signed sessions, replay protection, server-side provider validation, and cooldown enforcement.

---

## 🎨 Themes

VaultLua ships with a polished **light** and **dark** theme. The default is `system` (follows your OS preference).

- Toggle from the **sun/moon icon** in the top bar (any page)
- Or pick explicitly from **Settings → Appearance** (Light / Dark / System)
- Theme is persisted in `localStorage` under `vaultlua-theme`
- A pre-paint script in `<head>` prevents flash of incorrect theme (FOUC)

Both themes use smooth modern gradient colors — no harsh pure primaries.

---

## 🏗️ Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # 35 REST API endpoints
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── projects/             # Project CRUD + stats
│   │   ├── scripts/              # Scripts + publish versions
│   │   ├── keys/                 # License key CRUD + actions
│   │   ├── users/                # End user management
│   │   ├── sessions/             # Session list + terminate
│   │   ├── rewards/              # Server-authoritative reward flow
│   │   ├── api-keys/             # API key CRUD + rotate
│   │   ├── analytics/            # Aggregated metrics
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── discord/              # Discord integration
│   │   ├── notifications/        # User notifications
│   │   ├── search/               # Global search
│   │   ├── me/                   # Current profile
│   │   ├── seed/                 # Demo data seeding
│   │   └── v1/                   # Public REST API (bearer auth)
│   ├── layout.tsx                # Root layout with ThemeProvider
│   ├── page.tsx                  # Hash router entry point
│   └── globals.css               # Theme tokens (light + dark)
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── shared/                   # App shell, logo, primitives
│   ├── views/                    # Page-level views
│   ├── theme-provider.tsx        # next-themes wrapper
│   └── theme-toggle.tsx          # Sun/moon toggle button
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── authz.ts                  # RLS-equivalent server-side authz
│   ├── db.ts                     # Prisma client
│   ├── api.ts                    # API helpers (errors, rate limit)
│   ├── schemas.ts                # Zod validation schemas
│   ├── seed.ts                   # Demo data seeder
│   ├── session.ts                # getCurrentUser helper
│   ├── router.ts                 # Hash-based client router
│   └── use-project.ts            # Selected-project hook
└── prisma/
    └── schema.prisma             # 20+ tables, indexes, FKs
```

### Database tables
`profiles`, `projects`, `project_members`, `scripts`, `script_versions`, `licenses`, `end_users`, `sessions`, `heartbeats`, `reward_providers`, `reward_checkpoints`, `reward_sessions`, `reward_completions`, `api_keys`, `api_usage`, `discord_integrations`, `audit_logs`, `notifications`, `system_settings`

### Security model
- **Supabase service-role key equivalent is NEVER shipped to the browser** — only the anon-key equivalent is exposed.
- Every privileged action is re-validated server-side via the `authz` module.
- Reward sessions are HMAC-signed with the checkpoint cursor in the payload (replay protection).
- Rate limiting on every public endpoint.
- Zod validation on every API request body.
- Audit logging on every privileged action.

See [`src/lib/authz.ts`](src/lib/authz.ts) for the full authorization layer.

---

## 📚 Documentation

In-app documentation is available at `/#/docs` covering:
- Getting Started
- Projects
- Scripts & Versions
- License Keys
- HWID Binding
- Sessions & Heartbeats
- Reward Links
- REST API (with bash/lua/typescript examples)
- Discord Integration
- Analytics
- Security Model

---

## 🔌 REST API

Base URL: `/api/v1`

Authentication: Bearer token (API key created from the dashboard).

```bash
curl -H "Authorization: Bearer vlx_live_abc123..." \
  https://xyz.446.xyz/api/v1/projects
```

### Permissions
| Permission         | Scope                          |
|--------------------|--------------------------------|
| `projects:read`    | List and view projects         |
| `projects:write`   | Create and update projects     |
| `scripts:read`     | List scripts and versions      |
| `scripts:write`    | Create and publish scripts     |
| `users:read`       | List end users                 |
| `users:write`      | Ban, suspend, reset HWID       |
| `keys:read`        | List and search keys           |
| `keys:write`       | Generate, revoke, extend       |
| `analytics:read`   | View analytics data            |

### Rate limits
- Default: 1000 requests / hour / API key
- Public reward endpoints: 10 starts / min / IP, 30 completions / min / IP

---

## 🛠️ Scripts

```bash
bun run dev          # Start dev server (port 3000)
bun run lint         # ESLint check
bun run db:push      # Push schema to database
bun run db:generate  # Regenerate Prisma client
bun run db:migrate   # Create a migration
bun run db:reset     # Reset database (destroys all data)
bun run build        # Production build
bun run start        # Start production server
```

---

## 🌐 Domain structure

Designed for `xyz.446.xyz` with the option to split `/ads` into a subdomain later:

| Route                     | Purpose                              |
|---------------------------|--------------------------------------|
| `/`                       | Landing page                         |
| `/#/dashboard`            | Creator dashboard                    |
| `/#/projects`             | Projects                             |
| `/#/projects/:id`         | Project detail (8 tabs)              |
| `/#/users`                | Users                                |
| `/#/keys`                 | License keys                         |
| `/#/sessions`             | Live sessions                        |
| `/#/rewards`              | Reward configuration                 |
| `/#/analytics`            | Analytics                            |
| `/#/api-keys`             | API key management                   |
| `/#/discord`              | Discord integration                  |
| `/#/docs`                 | Developer documentation              |
| `/#/settings`             | Settings (incl. theme picker)        |
| `/#/admin`                | Admin panel                          |
| `/#/ads`                  | Public reward index                  |
| `/#/ads/get-key/:token`   | Public reward flow                   |
| `/#/auth/signin`          | Sign in                              |
| `/#/auth/signup`          | Sign up                              |
| `/#/auth/reset`           | Password reset                       |
| `/api/v1/*`               | REST API                             |

The hash-based router is used so the app works in any deployment context (including sandboxes that only expose one route). The router is abstracted in `src/lib/router.ts` — swapping to a subdomain-based router later requires minimal changes.

---

## ⚠️ What's mock vs production-ready

| Feature              | Status                                             |
|----------------------|----------------------------------------------------|
| Auth (NextAuth)      | ✅ Production-ready (credentials provider)          |
| RLS-equivalent authz | ✅ Production-ready (server-side enforcement)       |
| License keys         | ✅ Production-ready                                 |
| HWID binding         | ✅ Production-ready                                 |
| Sessions + heartbeat | ✅ Production-ready (HTTP polling; WS is roadmap)   |
| Reward flow          | ✅ Production-ready (Mock provider always succeeds) |
| Real reward providers| 🔌 Adapter interface ready; LoiLo/AdGem need creds |
| Discord bot          | 🔌 UI + backend complete; bot itself is mock       |
| REST API v1          | ✅ Production-ready                                 |
| Audit logging        | ✅ Production-ready                                 |
| Realtime (WebSocket) | 🔜 Roadmap (currently 10s HTTP polling)            |

---

## 📄 License

MIT — see [LICENSE](LICENSE).

VaultLua is not affiliated with Roblox Corporation. All product names, logos, and brands are property of their respective owners.
