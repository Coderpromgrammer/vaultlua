"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { ArrowRight, Lock, User, Eye, EyeOff } from "lucide-react";
import { VaultLogo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { navigate } from "@/lib/router";
import { toast } from "sonner";

export function AuthView({ mode }: { mode: "signin" | "signup" | "reset" }) {
  // We only support sign-in now — signup/reset routes redirect to signin.
  if (mode !== "signin") {
    if (typeof window !== "undefined") navigate("/auth/signin");
    return null;
  }

  return <SignInForm />;
}

function SignInForm() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(username, password);
    setLoading(false);
    if (error) {
      toast.error("Sign in failed", { description: error });
      return;
    }
    toast.success("Welcome back");
    navigate("/dashboard");
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
              Sign in to VaultLua
            </h1>
            <p className="text-sm text-muted-foreground mb-7">
              Welcome back. Pick up where you left off.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="admin"
                    className="pl-9 bg-muted/40 border-border/60"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 bg-muted/40 border-border/60"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
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
                &quot;We replaced three custom licensing tools with VaultLua. The HWID binding, reward links, and real-time session monitoring are exactly what we needed.&quot;
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
