"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Github, Chrome, Eye, EyeOff } from "lucide-react";
import { VaultLogo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { navigate } from "@/lib/router";
import { toast } from "sonner";

export function AuthView({ mode }: { mode: "signin" | "signup" | "reset" }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "reset") {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast.error("Reset failed", { description: error });
      } else {
        toast.success("Reset link sent", {
          description: `If an account exists for ${email}, you'll receive an email shortly.`,
        });
        setTimeout(() => navigate("/auth/signin"), 1500);
      }
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setLoading(false);
        toast.error("Password too short", {
          description: "Use at least 6 characters.",
        });
        return;
      }
      const { error, needsVerification } = await signUp(email, password, username);
      setLoading(false);
      if (error) {
        toast.error("Sign up failed", { description: error });
        return;
      }
      if (needsVerification) {
        setNeedsVerification(true);
        toast.success("Check your email", {
          description: "Click the confirmation link to activate your account.",
        });
      } else {
        toast.success("Welcome to VaultLua!", {
          description: "Your account is ready.",
        });
        navigate("/dashboard");
      }
      return;
    }

    // signin
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Sign in failed", {
        description: error,
      });
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
            {needsVerification ? (
              <Card className="glass-panel p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/10 grid place-items-center mx-auto mb-4 ring-1 ring-violet-500/30">
                  <Mail className="w-7 h-7 text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                  Click the link to activate your account, then sign in.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
                  onClick={() => navigate("/auth/signin")}
                >
                  Go to sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ) : (
              <>
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
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          minLength={3}
                          maxLength={40}
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
                        autoComplete="email"
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
                            className="text-xs text-violet-500 dark:text-violet-300 hover:underline"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                          className="pl-9 pr-9 bg-muted/40 border-border/60"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
                        onClick={() => toast.info("GitHub OAuth not configured yet")}
                      >
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-muted/30"
                        onClick={() => toast.info("Google OAuth not configured yet")}
                      >
                        <Chrome className="w-4 h-4 mr-2" />
                        Google
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-center text-sm text-muted-foreground mt-7">
                  {mode === "signin" && (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => navigate("/auth/signup")}
                        className="text-violet-500 dark:text-violet-300 hover:underline font-medium"
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
                        className="text-violet-500 dark:text-violet-300 hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                  {mode === "reset" && (
                    <button
                      onClick={() => navigate("/auth/signin")}
                      className="text-violet-500 dark:text-violet-300 hover:underline font-medium"
                    >
                      Back to sign in
                    </button>
                  )}
                </p>
              </>
            )}
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
