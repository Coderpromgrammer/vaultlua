"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Shield, KeyRound, HardDrive, Radio, Gift, BarChart3,
  Code2, MessageSquare, ArrowRight, Check, Terminal,
  Lock, Zap, Globe, ChevronRight, Star,
} from "lucide-react";
import { VaultLogo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { navigate } from "@/lib/router";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Shield,
    title: "Script Protection",
    description:
      "Server-side delivery keeps your source out of the browser. Clients receive only authorized payloads after license, HWID, and session validation.",
    accent: "from-violet-500/20 to-fuchsia-500/5 text-violet-300",
  },
  {
    icon: KeyRound,
    title: "License Keys",
    description:
      "Generate single or batch keys with durations from 1 day to lifetime. Revoke, ban, suspend, extend, shorten, transfer, or reset HWID at any time.",
    accent: "from-cyan-500/20 to-blue-500/5 text-cyan-300",
  },
  {
    icon: HardDrive,
    title: "HWID Binding",
    description:
      "Privacy-conscious device binding with reset cooldowns, history, and administrator override. Collects only a non-reversible device identifier.",
    accent: "from-emerald-500/20 to-teal-500/5 text-emerald-300",
  },
  {
    icon: Radio,
    title: "Live Sessions",
    description:
      "Real-time session tracking with heartbeats. Terminate any session, inspect device info, or kill all sessions for a user with one click.",
    accent: "from-amber-500/20 to-orange-500/5 text-amber-300",
  },
  {
    icon: Gift,
    title: "Reward Links",
    description:
      "Ad-gated reward flows with checkpoint progression, provider adapters, and server-authoritative completion. No frontend-trusted state, ever.",
    accent: "from-rose-500/20 to-pink-500/5 text-rose-300",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "24h, 7d, 30d, 90d, or custom ranges. Track requests, sessions, keys, rewards, and conversion rates with daily series breakdowns.",
    accent: "from-violet-500/20 to-cyan-500/5 text-violet-300",
  },
  {
    icon: Code2,
    title: "REST API",
    description:
      "Bearer-token API with granular permissions: projects, scripts, users, keys, analytics. JavaScript, TypeScript, Python, and Lua examples.",
    accent: "from-cyan-500/20 to-emerald-500/5 text-cyan-300",
  },
  {
    icon: MessageSquare,
    title: "Discord Integration",
    description:
      "Auto-assign roles on key redemption, remove on revocation, optional ban sync. Modular adapter supports any bot framework.",
    accent: "from-violet-500/20 to-fuchsia-500/5 text-violet-300",
  },
];

const WORKFLOW = [
  { step: "01", title: "Upload Script", description: "Paste or upload your Luau source. Versions are immutable once published." },
  { step: "02", title: "Configure Protection", description: "Enable HWID binding, set max sessions, define heartbeat behavior per script." },
  { step: "03", title: "Create License", description: "Generate single or batch keys. Choose duration, max sessions, notes." },
  { step: "04", title: "Distribute", description: "Share keys directly, embed in your executor, or generate public reward links." },
  { step: "05", title: "Monitor Sessions", description: "Watch live sessions, terminate bad actors, review analytics in real time." },
];

const PRICING = [
  {
    name: "Starter",
    price: "$9",
    cadence: "/mo",
    description: "For solo creators getting started",
    features: ["3 projects", "500 license keys", "500 concurrent sessions", "Community Discord", "Standard analytics", "Mock reward provider"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/mo",
    description: "For established creators with active communities",
    features: ["25 projects", "10,000 license keys", "20,000 concurrent sessions", "Realtime WebSocket sessions", "Advanced analytics & cohorts", "Discord role automation", "All reward providers", "Priority support"],
    cta: "Get Pro",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$99",
    cadence: "/mo",
    description: "For studios and large communities",
    features: ["Unlimited projects", "Unlimited license keys", "Unlimited sessions", "Dedicated infrastructure", "Audit log streaming", "Custom provider adapters", "SSO & SCIM", "99.95% SLA"],
    cta: "Contact sales",
    highlight: false,
  },
];

export function LandingView() {
  const { scrollY } = useScroll();
  // Subtle parallax only — do NOT fade opacity. Fading the whole hero (which
  // includes the floating preview card) creates a visual gap where the hero
  // is invisible but still occupies layout space, hiding the next section
  // during the scroll transition.
  const heroY = useTransform(scrollY, [0, 800], [0, 40]);
  // Gentle fade only on the very tail of the hero, so it doesn't gap.
  const heroOpacity = useTransform(scrollY, [0, 200, 600], [1, 1, 0.85]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass-panel-strong border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/landing")} className="flex items-center gap-2">
            <VaultLogo size={28} withText />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/docs")}>
              Documentation
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/ads")}>
              Reward demo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Pricing
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth/signin")}>
              Sign in
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              onClick={() => navigate("/auth/signin")}
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg grid-bg-fade pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 lg:px-6 pt-20 pb-24 lg:pt-32 lg:pb-32"
        >
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 bg-violet-500/10 text-violet-300 border-violet-500/30 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mr-1.5 status-pulse" />
                Production-grade infrastructure for Roblox script creators
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-balance leading-[1.05]"
            >
              Protect, license and<br />
              distribute your{" "}
              <span className="gradient-text">Roblox scripts</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed"
            >
              VaultLua is the developer infrastructure platform for licensing, protecting and distributing Luau scripts. HWID binding, sessions, reward links, REST API and analytics — all in one command center.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-9 flex flex-col sm:flex-row items-center gap-3"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 h-12 px-6 text-base"
                onClick={() => navigate("/auth/signin")}
              >
                Get started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base glass-panel"
                onClick={() => navigate("/docs")}
              >
                <Terminal className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-5 text-xs text-muted-foreground"
            >
              No credit card required · Demo accounts available · Production-grade security
            </motion.p>
          </div>

          {/* Floating preview */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative mt-16 mx-auto max-w-5xl"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 blur-3xl rounded-3xl" />
            <Card className="relative glass-panel-strong rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="ml-2 text-xs text-muted-foreground font-mono">
                  vaultlua.dev/dashboard
                </div>
              </div>
              <div className="grid grid-cols-12 min-h-[360px]">
                {/* mini sidebar */}
                <div className="col-span-2 border-r border-border/60 p-3 space-y-1">
                  {["Overview", "Projects", "Scripts", "Keys", "Sessions"].map((s, i) => (
                    <div
                      key={s}
                      className={cn(
                        "text-[10px] px-2 py-1.5 rounded",
                        i === 0
                          ? "bg-violet-500/20 text-violet-300"
                          : "text-muted-foreground"
                      )}
                    >
                      {s}
                    </div>
                  ))}
                </div>
                {/* main */}
                <div className="col-span-10 p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: "Projects", v: "12", c: "from-violet-500/30 to-fuchsia-500/10" },
                      { l: "Active Keys", v: "1,438", c: "from-cyan-500/30 to-blue-500/10" },
                      { l: "Sessions", v: "284", c: "from-emerald-500/30 to-teal-500/10" },
                      { l: "Rewards", v: "92", c: "from-amber-500/30 to-orange-500/10" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className={cn(
                          "rounded-lg p-2.5 bg-gradient-to-br border border-border/60",
                          s.c
                        )}
                      >
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.l}</div>
                        <div className="text-lg font-semibold tabular-nums">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/60 p-3 h-44 relative overflow-hidden">
                    <div className="text-[10px] text-muted-foreground mb-2">Requests · last 14 days</div>
                    <svg viewBox="0 0 400 100" className="w-full h-32" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.7 0.19 285)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="oklch(0.7 0.19 285)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,80 L30,70 L60,75 L90,55 L120,60 L150,40 L180,50 L210,30 L240,35 L270,25 L300,40 L330,20 L360,30 L400,15 L400,100 L0,100 Z"
                        fill="url(#hero-grad)"
                      />
                      <path
                        d="M0,80 L30,70 L60,75 L90,55 L120,60 L150,40 L180,50 L210,30 L240,35 L270,25 L300,40 L330,20 L360,30 L400,15"
                        fill="none"
                        stroke="oklch(0.7 0.19 285)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Trusted by creators powering the top Roblox communities
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { v: "18M+", l: "Scripts delivered" },
              { v: "240K", l: "Active keys" },
              { v: "99.97%", l: "API uptime" },
              { v: "<12ms", l: "Edge latency" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl md:text-3xl font-semibold gradient-text tabular-nums">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/30">
            Platform
          </Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
            Everything you need to run a script business
          </h2>
          <p className="mt-4 text-muted-foreground text-lg text-balance">
            From licensing to live sessions, from API to analytics — VaultLua handles the entire lifecycle of a Roblox script product.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              >
                <Card className="glass-panel p-5 h-full hover:border-violet-500/40 transition-colors group cursor-default">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center mb-4", f.accent)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Developer workflow */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
              Workflow
            </Badge>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
              From source to sessions in five steps
            </h2>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {WORKFLOW.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 w-14 h-14 rounded-full bg-card border-2 border-violet-500/40 grid place-items-center mb-4 glow-violet">
                      <span className="text-sm font-mono font-semibold gradient-text">{s.step}</span>
                    </div>
                    <h3 className="font-semibold mb-1.5 text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security highlight */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              <Lock className="w-3 h-3 mr-1.5" />
              Security model
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance mb-4">
              Server-authoritative by design. Browser never sees your secrets.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              The Supabase service-role key (or any equivalent privileged credential) is never shipped to the browser. Every privileged action is re-validated server-side. Reward completion, license expiration, HWID binding, role checks — all enforced by the server, never the frontend.
            </p>
            <div className="space-y-3">
              {[
                "RLS-equivalent access control on every query",
                "Signed reward sessions with replay protection",
                "Granular API key permissions (read/write per resource)",
                "Rate limiting on every public endpoint",
                "Audit logging on every privileged action",
                "Zod validation on every API request body",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 grid place-items-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Card className="glass-panel-strong p-6 font-mono text-xs leading-relaxed">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-muted-foreground text-[10px] ml-2">script-execution-flow.lua</span>
            </div>
            <pre className="text-muted-foreground overflow-x-auto text-[11px] leading-relaxed">
              <code>{`-- Client requests authorized script payload
local res = HttpRequest({
  url = "https://xyz.446.xyz/api/v1/execute",
  headers = {
    ["Authorization"] = "Bearer " .. key,
    ["X-HWID"] = deviceFingerprint()
  }
})

-- Server validates, server responds
if res.ok then
  loadstring(res.body)()
else
  warn("License invalid:", res.error)
end`}</code>
            </pre>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-4 bg-amber-500/10 text-amber-300 border-amber-500/30">
              <Zap className="w-3 h-3 mr-1.5" />
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
              Built for creators at every scale
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Start free. Upgrade when your community grows. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((p) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  className={cn(
                    "glass-panel p-6 h-full flex flex-col relative overflow-hidden",
                    p.highlight && "border-violet-500/40 glow-violet"
                  )}
                >
                  {p.highlight && (
                    <div className="absolute top-0 inset-x-0 h-px animated-border" />
                  )}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      {p.highlight && (
                        <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                          Most popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">{p.price}</span>
                    <span className="text-muted-foreground ml-1">{p.cadence}</span>
                  </div>
                  <Button
                    className={cn(
                      "w-full mb-6",
                      p.highlight
                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
                        : ""
                    )}
                    variant={p.highlight ? "default" : "outline"}
                    onClick={() => navigate("/auth/signin")}
                  >
                    {p.cta}
                  </Button>
                  <ul className="space-y-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
        <Card className="glass-panel-strong p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 grid-bg grid-bg-fade opacity-50 pointer-events-none" />
          <div className="relative">
            <Globe className="w-10 h-10 mx-auto mb-4 text-violet-300" />
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance mb-4">
              Ship your next script in minutes, not weeks.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-7 text-lg">
              Join the creators using VaultLua to protect, license, and distribute their Roblox scripts to millions of players.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 h-12 px-6"
                onClick={() => navigate("/auth/signin")}
              >
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 glass-panel"
                onClick={() => navigate("/docs")}
              >
                Read the docs
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <VaultLogo size={28} withText />
              <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Developer infrastructure for licensing, protecting and distributing Roblox Luau scripts.
              </p>
              <p className="mt-4 text-xs text-muted-foreground/70">
                © 2026 VaultLua. All rights reserved. Not affiliated with Roblox Corporation.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "Features", href: "/landing" },
                { label: "Pricing", href: "/landing#pricing" },
                { label: "Documentation", href: "/docs" },
                { label: "API reference", href: "/docs?section=api" },
              ]}
            />
            <FooterCol
              title="Developers"
              links={[
                { label: "Getting started", href: "/docs?section=getting-started" },
                { label: "REST API", href: "/docs?section=api" },
                { label: "Lua SDK", href: "/docs?section=sdk" },
                { label: "Reward flow", href: "/ads" },
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                { label: "Sign in", href: "/auth/signin" },
                { label: "Sign up", href: "/auth/signup" },
                { label: "Reset password", href: "/auth/reset" },
                { label: "Status", href: "/docs" },
              ]}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <button
              onClick={() => navigate(l.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
