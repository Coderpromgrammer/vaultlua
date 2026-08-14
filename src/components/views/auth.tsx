"use client";

import { SignIn, SignUp, useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { VaultLogo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { navigate } from "@/lib/router";

export function AuthView({ mode }: { mode: "signin" | "signup" | "reset" }) {
  const { redirectToSignIn } = useClerk();

  if (mode === "reset") {
    // Clerk hosts its own password-reset flow inside the SignIn component.
    // Redirect there rather than duplicating UI.
    redirectToSignIn();
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left side — Clerk auth */}
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
            </h1>
            <p className="text-sm text-muted-foreground mb-7">
              {mode === "signin" && "Welcome back. Pick up where you left off."}
              {mode === "signup" && "Start licensing your scripts in minutes."}
            </p>

            <div className="clerk-auth-container">
              {mode === "signin" ? (
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none border-0 p-0",
                    },
                  }}
                />
              ) : (
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none border-0 p-0",
                    },
                  }}
                />
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-7">
              {mode === "signin" && (
                <>
                  Don&apos;t have an account?{" "}
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
