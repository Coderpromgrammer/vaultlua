"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useRouter, navigate } from "@/lib/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Check, Lock, Loader2, ArrowRight, AlertTriangle,
  PartyPopper, Copy, Clock, ShieldCheck, ExternalLink,
} from "lucide-react";
import { VaultLogo } from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdsView() {
  const router = useRouter();
  // Route: /ads → index page (lets visitor pick a project)
  // Route: /ads/get-key/:projectToken → reward session flow
  if (router.segments.length >= 3 && router.segments[0] === "ads" && router.segments[1] === "get-key") {
    return <RewardFlow projectToken={router.segments[2]} />;
  }

  return <AdsIndex />;
}

function AdsIndex() {
  const [projectToken, setProjectToken] = useState("");

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="absolute inset-0 grid-bg grid-bg-fade pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <button
          onClick={() => navigate("/landing")}
          className="flex items-center gap-2 mx-auto mb-8"
        >
          <VaultLogo size={32} withText />
        </button>

        <Card className="glass-panel-strong p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-pink-500/10 grid place-items-center mx-auto mb-4 ring-1 ring-rose-500/30">
              <Gift className="w-7 h-7 text-rose-300" />
            </div>
            <h1 className="text-2xl font-semibold mb-1.5">Get a free key</h1>
            <p className="text-sm text-muted-foreground">
              Complete the reward checkpoints to unlock a free license key for the project you want to access.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Project token</label>
            <input
              type="text"
              value={projectToken}
              onChange={(e) => setProjectToken(e.target.value)}
              placeholder="vlx-7f3a"
              className="w-full h-11 px-3 rounded-lg bg-muted/40 border border-border/60 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 h-11"
              disabled={!projectToken}
              onClick={() => navigate(`/ads/get-key/${projectToken}`)}
            >
              Start reward flow
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have a project token?{" "}
              <button
                onClick={async () => {
                  // Fetch any public project for demo
                  const r = await fetch("/api/projects?pageSize=5");
                  const j = await r.json();
                  if (j?.data?.[0]) {
                    setProjectToken(j.data[0].identifier);
                    toast.success("Loaded a demo project token");
                  }
                }}
                className="text-violet-300 hover:text-violet-200 font-medium"
              >
                Load a demo project
              </button>
            </p>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: "Server-validated", desc: "No frontend tricks" },
            { icon: Clock, label: "Cooldown enforced", desc: "Server-authoritative" },
            { icon: Lock, label: "Signed sessions", desc: "Replay-protected" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="glass-panel p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-violet-300" />
                <div className="text-[10px] font-medium">{s.label}</div>
                <div className="text-[9px] text-muted-foreground">{s.desc}</div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function RewardFlow({ projectToken }: { projectToken: string }) {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rewardKey, setRewardKey] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Start session
  const startMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/rewards/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectToken }),
      });
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error?.message ?? "Failed to start reward session");
      return j.data;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Step 2: Poll for status
  const { data: sessionStatus, refetch } = useQuery({
    queryKey: ["reward-status", sessionId],
    queryFn: async () => {
      const r = await fetch(`/api/rewards/status?sessionId=${sessionId}`);
      const j = await r.json();
      return j?.data;
    },
    enabled: !!sessionId,
    refetchInterval: 3000,
  });

  // Auto-start on mount (only once)
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && !sessionId && !error) {
      startedRef.current = true;
      startMutation.mutate();
    }
  }, [sessionId, error, startMutation]);

  // Step 3: Complete a checkpoint
  const completeMutation = useMutation({
    mutationFn: async (checkpointId: string) => {
      const r = await fetch("/api/rewards/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, checkpointId }),
      });
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error?.message ?? "Failed to complete checkpoint");
      return j.data;
    },
    onSuccess: (data) => {
      refetch();
      qc.invalidateQueries({ queryKey: ["reward-status", sessionId] });
      if (data.allDone && data.rewardKey) {
        setRewardKey(data.rewardKey.key);
        setCooldownEndsAt(data.cooldownEndsAt);
        toast.success("All checkpoints completed!", {
          description: "Your reward key is ready below.",
        });
      } else {
        toast.success(`Checkpoint "${data.checkpointName}" completed`, {
          description: `Step ${data.nextCheckpoint} of ${data.totalCheckpoints}`,
        });
      }
    },
    onError: (err: Error) => {
      toast.error("Checkpoint failed", { description: err.message });
    },
  });

  // Cooldown timer
  const [cooldownMs, setCooldownMs] = useState(0);
  useEffect(() => {
    if (!cooldownEndsAt) return;
    const tick = () => {
      const ms = new Date(cooldownEndsAt).getTime() - Date.now();
      setCooldownMs(Math.max(0, ms));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [cooldownEndsAt]);

  const checkpoints = sessionStatus?.checkpoints ?? [];
  const currentCheckpoint = checkpoints.find((c: any) => c.state === "current");

  if (error) {
    return (
      <RewardFlowWrapper>
        <Card className="glass-panel-strong p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 grid place-items-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-300" />
          </div>
          <h2 className="text-xl font-semibold mb-1.5">Cannot start reward session</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/ads")} className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0">
            Back to start
          </Button>
        </Card>
      </RewardFlowWrapper>
    );
  }

  if (startMutation.isPending || !sessionStatus) {
    return (
      <RewardFlowWrapper>
        <Card className="glass-panel-strong p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-violet-300 animate-spin" />
          <p className="text-sm text-muted-foreground">Starting reward session…</p>
        </Card>
      </RewardFlowWrapper>
    );
  }

  if (rewardKey) {
    return (
      <RewardFlowWrapper>
        <Card className="glass-panel-strong p-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 grid place-items-center mx-auto mb-4 ring-1 ring-emerald-500/40"
          >
            <PartyPopper className="w-8 h-8 text-emerald-300" />
          </motion.div>
          <h2 className="text-2xl font-semibold mb-1.5">Reward unlocked!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You completed all {checkpoints.length} checkpoints. Here's your license key:
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto mb-4">
            <div className="flex-1 p-3 rounded-lg bg-muted/40 border border-border/60 font-mono text-sm text-center break-all">
              {rewardKey}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(rewardKey);
                toast.success("Key copied");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-amber-300/80 mb-6 flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3" />
            Save this key now. It will not be shown again.
          </div>
          {cooldownMs > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-6">
              <p className="text-xs text-amber-200">
                Next reward available in <span className="font-mono font-semibold">{formatMs(cooldownMs)}</span>
              </p>
            </div>
          )}
          <Button onClick={() => navigate("/ads")} variant="outline">
            Done
          </Button>
        </Card>
      </RewardFlowWrapper>
    );
  }

  return (
    <RewardFlowWrapper>
      <Card className="glass-panel-strong p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-1">{sessionStatus.project.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">{sessionStatus.project.identifier}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">
              Step {sessionStatus.currentCheckpoint + 1} of {sessionStatus.totalCheckpoints}
            </span>
            <span className="font-medium">
              {Math.round((sessionStatus.currentCheckpoint / sessionStatus.totalCheckpoints) * 100)}% complete
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(sessionStatus.currentCheckpoint / sessionStatus.totalCheckpoints) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Checkpoints */}
        <div className="space-y-2 mb-6">
          {checkpoints.map((c: any, i: number) => {
            const Icon =
              c.state === "completed" ? Check
              : c.state === "current" ? Loader2
              : Lock;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  c.state === "completed" && "bg-emerald-500/10 border-emerald-500/30",
                  c.state === "current" && "bg-violet-500/10 border-violet-500/40 glow-violet",
                  c.state === "locked" && "bg-muted/20 border-border/60 opacity-60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full grid place-items-center shrink-0",
                  c.state === "completed" && "bg-emerald-500/20 text-emerald-300",
                  c.state === "current" && "bg-violet-500/20 text-violet-300",
                  c.state === "locked" && "bg-muted/40 text-muted-foreground"
                )}>
                  <Icon className={cn("w-4 h-4", c.state === "current" && "animate-spin")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {c.state} · reward {c.rewardValue} · {c.provider}
                  </div>
                </div>
                {c.state === "current" && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0"
                    disabled={completeMutation.isPending}
                    onClick={() => completeMutation.mutate(c.id)}
                  >
                    {completeMutation.isPending ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verifying…</>
                    ) : (
                      <>Complete <ArrowRight className="w-3 h-3 ml-1" /></>
                    )}
                  </Button>
                )}
                {c.state === "completed" && (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                    <Check className="w-3 h-3 mr-1" /> Done
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Provider panel */}
        {currentCheckpoint && (
          <div className="p-4 rounded-lg bg-muted/20 border border-border/60 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/10 grid place-items-center shrink-0">
                <ExternalLink className="w-4 h-4 text-violet-300" />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-medium mb-1">Mock reward provider</p>
                <p className="text-muted-foreground leading-relaxed">
                  In production, this area would load the provider's ad experience (video, survey, offer wall). Completion is verified via signed server-to-server callback. In this demo, simply click <strong className="text-foreground">Complete</strong> above to simulate a verified completion.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-4 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            Server-authoritative · signed session
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Session expires: {new Date(sessionStatus.expiresAt).toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </RewardFlowWrapper>
  );
}

function RewardFlowWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="absolute inset-0 grid-bg grid-bg-fade pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-violet-600/15 via-fuchsia-600/5 to-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-lg">
        <button
          onClick={() => navigate("/ads")}
          className="flex items-center gap-2 mx-auto mb-6"
        >
          <VaultLogo size={28} withText />
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}
