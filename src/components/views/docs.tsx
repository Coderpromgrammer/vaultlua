"use client";

import { useState } from "react";
import {
  BookOpen, Terminal, FolderKanban, FileCode2, KeyRound, HardDrive,
  Radio, Gift, Code2, MessageSquare, BarChart3, Shield, ChevronRight,
  Search, Copy, Check,
} from "lucide-react";
import { PageHeader } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "scripts", label: "Scripts & Versions", icon: FileCode2 },
  { id: "keys", label: "License Keys", icon: KeyRound },
  { id: "hwid", label: "HWID Binding", icon: HardDrive },
  { id: "sessions", label: "Sessions & Heartbeats", icon: Radio },
  { id: "rewards", label: "Reward Links", icon: Gift },
  { id: "api", label: "REST API", icon: Code2 },
  { id: "discord", label: "Discord Integration", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "security", label: "Security Model", icon: Shield },
];

export function DocsView() {
  const [active, setActive] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = SECTIONS.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()));

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <PageHeader
        title="Documentation"
        description="Everything you need to integrate VaultLua into your Roblox script distribution workflow."
        actions={
          <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30">
            v1.0
          </Badge>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <Card className="glass-panel p-3 h-fit lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search docs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/40 h-8 text-xs"
            />
          </div>
          <nav className="space-y-0.5">
            {filtered.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActive(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                    active === s.id
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content */}
        <div className="space-y-6 min-w-0">
          <DocSection id="getting-started" icon={BookOpen} title="Getting Started" description="Set up your account, create your first project, and ship a script in under 5 minutes.">
            <p>VaultLua is a developer infrastructure platform for licensing, protecting, and distributing Roblox Luau scripts. It handles the entire lifecycle of a script product: from versioned source delivery, to license key generation and validation, to real-time session monitoring and reward-link distribution.</p>
            <p>This guide walks you through the core workflow. By the end you'll have a published script, a batch of license keys, and a working public reward link that issues free keys to your community.</p>
            <h4>Prerequisites</h4>
            <ul>
              <li>A VaultLua account (any role works for testing — sign in with a demo account to skip setup).</li>
              <li>At least one Luau script you own or are authorized to distribute.</li>
              <li>A way to call the VaultLua API from your client (HTTP requests, executor, or bot).</li>
            </ul>
            <h4>The 5-minute path</h4>
            <ol>
              <li><strong>Create a project</strong> from the Projects page. The project identifier (e.g. <code>vlx-7f3a</code>) is what your client will reference.</li>
              <li><strong>Add a script</strong> to the project and publish version <code>1.0.0</code>. Paste your Luau source into the payload field — it's stored server-side and never shipped to the browser.</li>
              <li><strong>Generate keys</strong> from the Keys page. Choose a duration (1d, 7d, 30d, lifetime) and a max session count.</li>
              <li><strong>Distribute</strong> keys directly, or create a reward link and share it.</li>
              <li><strong>Monitor sessions</strong> on the Sessions page — every execution creates a session record with heartbeat tracking.</li>
            </ol>
          </DocSection>

          <DocSection id="projects" icon={FolderKanban} title="Projects" description="Projects are the top-level container for scripts, keys, users, and sessions. Each project is fully isolated.">
            <p>Every project has a unique, immutable identifier (e.g. <code>vlx-7f3a</code>) that your client uses to reference the project in API calls. The identifier is also used in public reward link URLs.</p>
            <p>Projects can be <strong>private</strong> (default — only members can access) or <strong>public</strong> (any signed-in user can read). Visibility does not affect license validation — a valid key works regardless of project visibility.</p>
            <h4>Project members</h4>
            <p>You can invite other VaultLua users to your project with one of four roles:</p>
            <ul>
              <li><strong>Owner</strong> — full control, can delete the project</li>
              <li><strong>Admin</strong> — can manage members, scripts, keys</li>
              <li><strong>Editor</strong> — can manage scripts and keys, cannot manage members</li>
              <li><strong>Viewer</strong> — read-only access to all project data</li>
            </ul>
            <h4>API: List projects</h4>
            <CodeBlock
              id="projects-list"
              copied={copied}
              onCopy={copy}
              lang="bash"
              code={`curl -H "Authorization: Bearer vlx_live_abc123" \\
  https://xyz.446.xyz/api/v1/projects

# 200 OK
{
  "success": true,
  "data": [
    {
      "id": "cm3x...",
      "identifier": "vlx-7f3a",
      "name": "Phantom Hub",
      "status": "active",
      "visibility": "private",
      "createdAt": "2026-08-01T..."
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}`}
            />
          </DocSection>

          <DocSection id="scripts" icon={FileCode2} title="Scripts & Versions" description="Scripts are versioned containers for your Luau payloads. Publish new versions without updating every license.">
            <p>A script is the unit of code that gets delivered to clients. Each script has a current version (semver, e.g. <code>1.2.0</code>) and an immutable history of every published version. When you publish a new version, every active license instantly resolves to it — no need to re-issue keys.</p>
            <h4>Publishing a version</h4>
            <p>From the project's Scripts tab, click <strong>Publish new version</strong>. Enter the new semver, a changelog, and the Luau payload. The payload is stored server-side under a content-addressed reference (e.g. <code>scripts/&lt;id&gt;/1.2.0.luau</code>) and delivered only to clients that pass full license validation.</p>
            <CodeBlock
              id="publish"
              copied={copied}
              onCopy={copy}
              lang="bash"
              code={`curl -X POST \\
  -H "Authorization: Bearer vlx_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "version": "1.2.0",
    "changelog": "Performance improvements and bug fixes",
    "payload": "-- Your Luau source here\\nlocal function main() print(1) end"
  }' \\
  https://xyz.446.xyz/api/v1/scripts/cm3x.../publish`}
            />
            <h4>Disabling a script</h4>
            <p>If you need to instantly stop distribution (e.g. for a security issue), set the script status to <code>disabled</code>. All active sessions are terminated within seconds, and new license validations for that script return <code>403 script_disabled</code>. Existing keys remain valid and resume working when the script is re-published.</p>
          </DocSection>

          <DocSection id="keys" icon={KeyRound} title="License Keys" description="Generate, revoke, ban, suspend, extend, shorten, transfer, reset HWID. Keys are the unit of authorization.">
            <p>License keys are the primary authorization mechanism. A key grants the holder the right to execute a specific script (or any script in the project, depending on configuration) for a defined duration. Keys can be generated in batches of up to 500 at once.</p>
            <h4>Key statuses</h4>
            <ul>
              <li><strong>unclaimed</strong> — generated but not yet redeemed (no HWID bound, no first-use timestamp)</li>
              <li><strong>active</strong> — claimed and valid</li>
              <li><strong>expired</strong> — past the expiration date</li>
              <li><strong>banned</strong> — administrator disabled (cannot be reactivated by user)</li>
              <li><strong>revoked</strong> — permanently killed (cannot be reactivated)</li>
              <li><strong>suspended</strong> — temporarily disabled (can be unsuspended)</li>
            </ul>
            <h4>Durations</h4>
            <p>Supported durations: <code>1 day</code>, <code>3 days</code>, <code>7 days</code>, <code>30 days</code>, <code>90 days</code>, <code>lifetime</code> (no expiration), or <code>custom</code> (any number of days up to 100 years).</p>
            <h4>Extending and shortening</h4>
            <p>Use the extend endpoint with a positive or negative <code>daysDelta</code>. Lifetime keys cannot be extended (they have no expiration), but they can be shortened to convert them into time-limited keys.</p>
            <CodeBlock
              id="extend-key"
              copied={copied}
              onCopy={copy}
              lang="bash"
              code={`# Extend by 7 days
curl -X POST \\
  -H "Authorization: Bearer vlx_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"daysDelta": 7}' \\
  https://xyz.446.xyz/api/v1/keys/cm3x.../extend

# Shorten by 3 days
curl -X POST \\
  -H "Authorization: Bearer vlx_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"daysDelta": -3}' \\
  https://xyz.446.xyz/api/v1/keys/cm3x.../extend`}
            />
          </DocSection>

          <DocSection id="hwid" icon={HardDrive} title="HWID Binding" description="Privacy-conscious device binding. Collects only a non-reversible device identifier.">
            <p>HWID (Hardware ID) binding ties a license key to a specific device on first use. After binding, the key will only work from that device. This prevents key sharing and resale.</p>
            <h4>Privacy model</h4>
            <p>VaultLua's HWID is intentionally minimal. The recommended approach is to compute a stable hash from non-identifying device signals (e.g. CPU model + GPU model + OS version + Roblox install hash) and send only the hash. The raw signals never leave the client. The hash cannot be reversed to identify the user.</p>
            <h4>Reset flow</h4>
            <p>Users may legitimately need to reset their HWID (new computer, reformat, hardware upgrade). VaultLua supports:</p>
            <ul>
              <li><strong>User-initiated reset</strong> — available with a configurable cooldown (default 7 days)</li>
              <li><strong>Creator override</strong> — project owners can reset HWID at any time, no cooldown</li>
              <li><strong>Admin override</strong> — platform admins can reset HWID for any key</li>
            </ul>
            <p>Every reset is recorded in the audit log with the actor, timestamp, and key.</p>
            <CodeBlock
              id="reset-hwid"
              copied={copied}
              onCopy={copy}
              lang="lua"
              code={`-- Client-side: compute HWID (recommended pattern)
local function computeHwid()
  local signals = {
    game:GetService("Players").LocalPlayer.UserId,
    settings().Roblox.UserName,
    -- Add hardware signals here
  }
  -- Hash with a stable algorithm
  return HttpService:GenerateGUID(false) .. table.concat(signals)
end

-- Send to server on first execution
local res = HttpService:PostAsync(
  "https://xyz.446.xyz/api/v1/execute",
  HttpService:JSONEncode({
    key = "VLX-XXXX-XXXX-XXXX-XXXX",
    hwid = computeHwid(),
  })
)`}
            />
          </DocSection>

          <DocSection id="sessions" icon={Radio} title="Sessions & Heartbeats" description="Every script execution creates a session. Heartbeats keep sessions alive.">
            <p>When a client successfully validates a license and receives a script payload, the server creates a <strong>session</strong> record. Sessions track: the user, the project, the script, the license, the device, the start time, the last heartbeat, and the current status.</p>
            <h4>Heartbeat protocol</h4>
            <p>After initial execution, the client should send a heartbeat every 60 seconds. The heartbeat contains the session token and the license key. If no heartbeat is received for a configurable period (default 3 minutes), the session is automatically marked <code>idle</code>. After 15 minutes without heartbeat, it's marked <code>disconnected</code>.</p>
            <CodeBlock
              id="heartbeat"
              copied={copied}
              onCopy={copy}
              lang="lua"
              code={`-- Heartbeat loop (run after initial execution)
task.spawn(function()
  while true do
    pcall(function()
      HttpService:PostAsync(
        "https://xyz.446.xyz/api/v1/sessions/heartbeat",
        HttpService:JSONEncode({
          sessionToken = SESSION_TOKEN,
          key = LICENSE_KEY,
        })
      )
    end)
    task.wait(60)
  end
end)`}
            />
            <h4>Session statuses</h4>
            <ul>
              <li><strong>active</strong> — heartbeat received in last 3 minutes</li>
              <li><strong>idle</strong> — no heartbeat for 3-15 minutes</li>
              <li><strong>disconnected</strong> — no heartbeat for 15+ minutes (auto)</li>
              <li><strong>terminated</strong> — killed by creator, admin, or license revocation</li>
            </ul>
          </DocSection>

          <DocSection id="rewards" icon={Gift} title="Reward Links" description="Server-authoritative ad-gated reward flow. The frontend never decides a checkpoint is complete.">
            <p>Reward links let you distribute free license keys to users who complete ad-offers. The flow is checkpoint-based: each reward session has 1-N checkpoints, and the user must complete all of them to receive the reward key.</p>
            <h4>The flow</h4>
            <ol>
              <li>Visitor opens <code>/ads/get-key/&lt;project-identifier&gt;</code></li>
              <li>Server creates a signed, anonymous session with an expiration (30 min)</li>
              <li>Visitor completes checkpoint 1 → server validates via provider callback → server signs next-step payload</li>
              <li>Repeat for each checkpoint</li>
              <li>When all checkpoints are complete, server generates a license key and returns it</li>
              <li>Server enforces a configurable cooldown before the same IP can start another session</li>
            </ol>
            <h4>Anti-fraud measures</h4>
            <ul>
              <li><strong>Signed sessions</strong> — every session has an HMAC signature that's verified on every checkpoint completion</li>
              <li><strong>Replay protection</strong> — the signature includes the checkpoint cursor; you can't skip ahead</li>
              <li><strong>Server-side provider validation</strong> — the frontend's "complete" button just asks the server to verify with the provider; only the server's response is trusted</li>
              <li><strong>Rate limiting</strong> — 10 session starts per IP per minute; 30 checkpoint completions per IP per minute</li>
              <li><strong>Cooldown enforcement</strong> — server-authoritative; JavaScript timers are display-only</li>
              <li><strong>Duplicate completion detection</strong> — each checkpoint can only be completed once per session</li>
            </ul>
            <h4>Provider adapters</h4>
            <p>Reward providers are pluggable. The interface is:</p>
            <CodeBlock
              id="provider-iface"
              copied={copied}
              onCopy={copy}
              lang="typescript"
              code={`interface RewardProvider {
  createLink(checkpoint: Checkpoint): Promise<{ url: string; token: string }>;
  validateCompletion(token: string): Promise<{ verified: boolean; fraudScore: number }>;
  handleCallback(payload: unknown): Promise<{ sessionId: string; checkpointId: string }>;
  getStatistics(): Promise<{ completions: number; revenue: number }>;
}`}
            />
            <p>The <code>mock</code> provider is bundled and always succeeds (used for development). Real providers (LoiLo, AdGem, etc.) are implemented as separate adapters and require provider credentials stored server-side.</p>
          </DocSection>

          <DocSection id="api" icon={Code2} title="REST API" description="Bearer-token authenticated. Granular per-resource permissions. Rate-limited per key.">
            <p>The REST API is the primary integration surface for bots, CI pipelines, and executor scripts. Every endpoint is authenticated with a bearer token (an API key created from the dashboard) and enforces granular per-resource permissions.</p>
            <h4>Base URL</h4>
            <pre className="text-xs font-mono p-3 rounded-lg bg-muted/40 border border-border/60">https://xyz.446.xyz/api/v1</pre>
            <h4>Authentication</h4>
            <p>Send your API key as a Bearer token in the Authorization header:</p>
            <CodeBlock
              id="auth"
              copied={copied}
              onCopy={copy}
              lang="bash"
              code={`curl -H "Authorization: Bearer vlx_live_abc123..." \\
  https://xyz.446.xyz/api/v1/projects`}
            />
            <h4>Permissions</h4>
            <p>Each API key has a set of permissions. Requests that require a permission the key doesn't have return <code>403 forbidden</code> with details.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-3">
              {["projects:read","projects:write","scripts:read","scripts:write","users:read","users:write","keys:read","keys:write","analytics:read"].map((p) => (
                <Badge key={p} variant="outline" className="font-mono text-[10px] justify-center bg-violet-500/10 text-violet-300 border-violet-500/20">{p}</Badge>
              ))}
            </div>
            <h4>Rate limits</h4>
            <p>Default rate limit is 1000 requests per hour per API key. Rate-limited responses return <code>429 rate_limited</code> with a <code>Retry-After</code> header. Contact support to increase limits.</p>
            <h4>Errors</h4>
            <p>All errors follow a consistent structure:</p>
            <CodeBlock
              id="error"
              copied={copied}
              onCopy={copy}
              lang="json"
              code={`{
  "success": false,
  "error": {
    "code": "forbidden",
    "message": "Missing required permission: keys:write",
    "details": null
  }
}`}
            />
            <h4>Endpoints</h4>
            <div className="space-y-1">
              {[
                ["GET", "/projects", "List projects", "projects:read"],
                ["POST", "/projects", "Create project", "projects:write"],
                ["GET", "/projects/:id", "Get project", "projects:read"],
                ["GET", "/scripts?projectId=", "List scripts", "scripts:read"],
                ["POST", "/scripts", "Create script", "scripts:write"],
                ["POST", "/scripts/:id/publish", "Publish version", "scripts:write"],
                ["GET", "/keys?projectId=", "List keys", "keys:read"],
                ["POST", "/keys", "Generate keys", "keys:write"],
                ["DELETE", "/keys/:id", "Revoke key", "keys:write"],
                ["POST", "/keys/:id/extend", "Extend/shorten", "keys:write"],
                ["POST", "/keys/:id/reset-hwid", "Reset HWID", "keys:write"],
                ["GET", "/users?projectId=", "List end users", "users:read"],
                ["POST", "/users/:id", "Ban/unban/etc", "users:write"],
                ["GET", "/sessions?projectId=", "List sessions", "users:read"],
                ["POST", "/sessions/:id/terminate", "Terminate session", "users:write"],
                ["GET", "/analytics?projectId=&range=7d", "Analytics", "analytics:read"],
              ].map((row, i) => (
                <div key={`${row[0]}-${row[1]}-${i}`} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Badge variant="outline" className={cn("text-[10px] font-mono w-12 justify-center", row[0] === "GET" ? "text-emerald-600 dark:text-emerald-300 border-emerald-500/30" : row[0] === "POST" ? "text-amber-600 dark:text-amber-300 border-amber-500/30" : "text-rose-600 dark:text-rose-300 border-rose-500/30")}>
                    {row[0]}
                  </Badge>
                  <code className="text-xs flex-1 truncate">{row[1]}</code>
                  <span className="text-xs text-muted-foreground hidden md:inline">{row[2]}</span>
                  <Badge variant="outline" className="text-[9px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20">{row[3]}</Badge>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="discord" icon={MessageSquare} title="Discord Integration" description="Auto-assign roles on key redemption. Remove on revocation. Bot token never exposed to frontend.">
            <p>VaultLua's Discord integration lets you tie license status to Discord roles. The most common pattern is: <em>active key = "Verified" role, expired key = role removed, banned user = all roles removed</em>.</p>
            <h4>Setup</h4>
            <ol>
              <li>From the project's Discord tab, click <strong>Connect bot</strong></li>
              <li>Authorize the VaultLua bot to your server with the <code>Manage Roles</code> permission</li>
              <li>Configure role mappings: license status → Discord role ID</li>
              <li>Choose which events trigger a Discord notification</li>
            </ol>
            <h4>Security model</h4>
            <p>The Discord bot token is stored server-side only and is never shipped to the browser. All Discord API calls happen from the VaultLua backend. The dashboard only displays the bot's connection status and guild name — never the token itself.</p>
            <h4>Webhooks</h4>
            <p>For events that don't need role changes (e.g. reward completions, suspicious activity), you can configure a webhook URL. VaultLua posts a JSON payload to the webhook on each event.</p>
            <CodeBlock
              id="webhook"
              copied={copied}
              onCopy={copy}
              lang="json"
              code={`{
  "event": "key.redeemed",
  "project": "Phantom Hub",
  "key": "VLX-XXXX-…",
  "user": "user_vlx-7f3a_5",
  "timestamp": "2026-08-13T..."
}`}
            />
          </DocSection>

          <DocSection id="analytics" icon={BarChart3} title="Analytics" description="24h, 7d, 30d, 90d, or custom ranges. Daily series for requests, sessions, keys, rewards.">
            <p>The Analytics page aggregates metrics across every project you can access. All numbers are computed from the underlying audit log and session records — no separate analytics database.</p>
            <h4>Available metrics</h4>
            <ul>
              <li><strong>Total requests</strong> — every API call to a script execution endpoint</li>
              <li><strong>Successful requests</strong> — requests that resulted in a delivered payload</li>
              <li><strong>Failed requests</strong> — requests that returned an error (invalid key, banned, expired, etc.)</li>
              <li><strong>Active users</strong> — distinct end users with activity in the range</li>
              <li><strong>Active sessions</strong> — sessions with a heartbeat in the last 3 minutes</li>
              <li><strong>Keys created / redeemed / expired</strong> — counts in the range</li>
              <li><strong>Rewards started / completed</strong> — reward session funnel</li>
              <li><strong>Reward conversion rate</strong> — completed / started</li>
            </ul>
          </DocSection>

          <DocSection id="security" icon={Shield} title="Security Model" description="Server-authoritative by design. The browser never sees your secrets. RLS-equivalent access control on every query.">
            <p>VaultLua is built on a strict server-authoritative security model. Every privileged action is re-validated on the server, and the frontend is treated as untrusted.</p>
            <h4>What the browser never sees</h4>
            <ul>
              <li>Supabase service-role key (or any equivalent privileged credential)</li>
              <li>Reward provider API tokens</li>
              <li>Discord bot tokens</li>
              <li>API key hashes (only the prefix is shown)</li>
              <li>Internal database credentials</li>
              <li>Raw Luau script payloads (only delivered to validated clients via the execution endpoint)</li>
              <li>Audit log metadata beyond what the user is authorized to see</li>
            </ul>
            <h4>Row Level Security equivalent</h4>
            <p>In production, VaultLua uses Supabase PostgreSQL Row Level Security (RLS) policies to enforce access control at the database layer. In this self-contained deployment, the same rules are enforced at the server layer via the <code>authz</code> module:</p>
            <ul>
              <li>A creator can only access projects they own or belong to</li>
              <li>Project members can only access resources belonging to their project</li>
              <li>Normal users cannot access: service secrets, provider API tokens, internal logs, other creators' projects, private scripts, admin settings</li>
              <li>Admin access is explicitly controlled by role, not by membership</li>
            </ul>
            <h4>Never trust the frontend</h4>
            <p>The server NEVER trusts these from the frontend:</p>
            <ul>
              <li><strong>Roles</strong> — always re-read from the session/profile</li>
              <li><strong>Timestamps</strong> — always use server time</li>
              <li><strong>Reward completion</strong> — always verify with the provider via signed callback</li>
              <li><strong>Expiration</strong> — always re-compute from the database</li>
              <li><strong>Permissions</strong> — always re-check per request</li>
            </ul>
            <h4>Replay protection</h4>
            <p>Reward sessions are signed with an HMAC that includes the checkpoint cursor. You cannot replay an old "completed" response to skip ahead — the cursor in the signed payload must match the current state.</p>
          </DocSection>
        </div>
      </div>
    </div>
  );
}

function DocSection({
  id, icon: Icon, title, description, children,
}: {
  id: string; icon: any; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <Card id={id} className="glass-panel p-6 scroll-mt-20">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 grid place-items-center shrink-0">
          <Icon className="w-4 h-4 text-violet-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed space-y-3 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:text-foreground [&_li]:text-muted-foreground [&_li]:ml-4 [&_p]:text-muted-foreground [&_code]:text-violet-300 [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono [&_strong]:text-foreground [&_a]:text-violet-300">
        {children}
      </div>
    </Card>
  );
}

function CodeBlock({
  id, copied, onCopy, lang, code,
}: {
  id: string; copied: string | null; onCopy: (key: string, text: string) => void; lang: string; code: string;
}) {
  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border/60 bg-[oklch(0.13_0.015_265)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/20">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{lang}</span>
        <button
          onClick={() => onCopy(id, code)}
          className="text-[10px] text-muted-foreground hover:text-violet-300 flex items-center gap-1"
        >
          {copied === id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
