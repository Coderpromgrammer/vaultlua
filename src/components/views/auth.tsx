"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Github, Chrome } from "lucide-react";
import { VaultLogo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { navigate } from "@/lib/router";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { label: "Owner", email: "owner@vaultlua.dev", role: "Full access + admin" },
  { label: "Admin", email: "admin@vaultlua.dev", role: "Admin panel access" },
  { label: "Creator", email: "creator@vaultlua.dev", role: "Standard creator" },
];

export function AuthView({ mode }: { mode: "signin" | "signup" | "reset" }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "reset") {
      toast.success("Password reset link sent", {
        description: `If an account exists for ${email}, you'll receive an email shortly.`,
      });
      setTimeout(() => navigate("/auth/signin"), 1200);
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Sign in failed", {
        description: "Check your email and password, then try again.",
      });
      return;
    }
    toast.success("Welcome back");
    navigate("/dashboard");
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("vaultlua-demo");
    toast.info("Demo credentials filled in", {
      description: "Click Sign in to continue.",
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left side — form */}
      <div className="flex flex-col p-6 lg:p-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 w-fit"
          >
            <VaultLogo size={28} withText />
          </button>
          <ThemeToggle />
        </div>

        <div className="flex-1 grid place-items-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-semibold tracking-tight mb-1.5">
              {mode === "signin" && "Sign in to VaultLua"}
              {mode === "signup" && "Create your VaultLua account"}
              {mode === "reset" && "Reset your password"}
            </h1>
            <p className="text-sm text-muted-foreground mb-7">
              {mode === "signin" && "Welcome back. Pick up where you left off."}
              {mode === "signup" && "Start licensing your scripts in minutes."}
              {mode === "reset" && "We'll send you a recovery link by email."}
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="creator_dan"
                      className="pl-9 bg-muted/40 border-border/60"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@studio.dev"
                    className="pl-9 bg-muted/40 border-border/60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              {mode !== "reset" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => navigate("/auth/reset")}
                        className="text-xs text-violet-300 hover:text-violet-200"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={mode === "signup" ? "At least 12 characters" : "••••••••"}
                      className="pl-9 bg-muted/40 border-border/60"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Working…
                  </span>
                ) : (
                  <>
                    {mode === "signin" && "Sign in"}
                    {mode === "signup" && "Create account"}
                    {mode === "reset" && "Send reset link"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {mode !== "reset" && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <Separator className="flex-1" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    or continue with
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="bg-muted/30"
                    onClick={() => toast.info("OAuth not configured in demo")}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-muted/30"
                    onClick={() => toast.info("OAuth not configured in demo")}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                </div>
              </>
            )}

            {mode === "signin" && (
              <>
                <div className="mt-7 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20">
                  <p className="text-xs font-medium text-violet-200 mb-2.5">
                    Try a demo account
                  </p>
                  <div className="space-y-1.5">
                    {DEMO_ACCOUNTS.map((a) => (
                      <button
                        key={a.email}
                        onClick={() => fillDemoAccount(a.email)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-violet-500/10 transition-colors text-left"
                      >
                        <div>
                          <div className="text-xs font-medium">{a.label}</div>
                          <div className="text-[10px] text-muted-foreground">{a.email}</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground/70">{a.role}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-2.5">
                    Password for all demo accounts: <code className="bg-black/40 px-1 py-0.5 rounded">vaultlua-demo</code>
                  </p>
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground mt-7">
              {mode === "signin" && (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/signup")}
                    className="text-violet-300 hover:text-violet-200 font-medium"
                  >
                    Sign up
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/signin")}
                    className="text-violet-300 hover:text-violet-200 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
              {mode === "reset" && (
                <button
                  onClick={() => navigate("/auth/signin")}
                  className="text-violet-300 hover:text-violet-200 font-medium"
                >
                  Back to sign in
                </button>
              )}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side — showcase panel */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-card border-l border-border/40">
        <div className="absolute inset-0 grid-bg grid-bg-fade" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col justify-between p-12 h-full">
          <div>
            <Card className="glass-panel-strong p-5 max-w-md">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 status-pulse" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  All systems operational
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                "We replaced three custom licensing tools with VaultLua. The HWID binding, reward links, and real-time session monitoring are exactly what we needed."
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                — Studio lead, top-10 Roblox automation community
              </p>
            </Card>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { v: "18M+", l: "Scripts delivered" },
              { v: "99.97%", l: "Uptime" },
              { v: "<12ms", l: "Edge latency" },
            ].map((s) => (
              <Card key={s.l} className="glass-panel p-4">
                <div className="text-xl font-semibold gradient-text tabular-nums">{s.v}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
