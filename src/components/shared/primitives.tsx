"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "violet",
  loading = false,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  accent?: "violet" | "cyan" | "emerald" | "amber" | "rose";
  loading?: boolean;
}) {
  const accentMap = {
    violet: "from-violet-500/25 to-fuchsia-500/10 text-violet-600 dark:text-violet-300",
    cyan: "from-cyan-500/25 to-blue-500/10 text-cyan-600 dark:text-cyan-300",
    emerald: "from-emerald-500/25 to-teal-500/10 text-emerald-600 dark:text-emerald-300",
    amber: "from-amber-500/25 to-orange-500/10 text-amber-600 dark:text-amber-300",
    rose: "from-rose-500/25 to-pink-500/10 text-rose-600 dark:text-rose-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card className="glass-panel p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {label}
            </p>
            {loading ? (
              <div className="h-7 w-20 shimmer rounded" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
            )}
            {delta !== undefined && !loading && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {delta >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span className="tabular-nums">
                  {Math.abs(delta).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center",
              accentMap[accent]
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </Card>
    </motion.div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
      <div className="space-y-1">
        {breadcrumb}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 grid place-items-center mb-4 ring-1 ring-border/60">
        <Icon className="w-7 h-7 text-violet-300" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    active: "bg-emerald-500 dark:bg-emerald-400 text-emerald-500 dark:text-emerald-400",
    idle: "bg-amber-500 dark:bg-amber-400 text-amber-500 dark:text-amber-400",
    disconnected: "bg-zinc-500 dark:bg-zinc-500 text-zinc-500 dark:text-zinc-500",
    terminated: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
    completed: "bg-emerald-500 dark:bg-emerald-400 text-emerald-500 dark:text-emerald-400",
    expired: "bg-zinc-500 dark:bg-zinc-500 text-zinc-500 dark:text-zinc-500",
    banned: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
    revoked: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
    suspended: "bg-amber-500 dark:bg-amber-400 text-amber-500 dark:text-amber-400",
    unclaimed: "bg-cyan-500 dark:bg-cyan-400 text-cyan-500 dark:text-cyan-400",
    published: "bg-emerald-500 dark:bg-emerald-400 text-emerald-500 dark:text-emerald-400",
    draft: "bg-zinc-500 dark:bg-zinc-500 text-zinc-500 dark:text-zinc-500",
    disabled: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
    connected: "bg-emerald-500 dark:bg-emerald-400 text-emerald-500 dark:text-emerald-400",
    pending: "bg-amber-500 dark:bg-amber-400 text-amber-500 dark:text-amber-400",
    error: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
    cooldown: "bg-amber-500 dark:bg-amber-400 text-amber-500 dark:text-amber-400",
    blocked: "bg-rose-500 dark:bg-rose-400 text-rose-500 dark:text-rose-400",
  };
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full status-pulse",
        map[status] ?? "bg-zinc-500 dark:bg-zinc-500 text-zinc-500 dark:text-zinc-500",
        className
      )}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  // Theme-aware color classes. Each entry uses light-mode `text-*-700` and
  // dark-mode `dark:text-*-300` so the badge is readable on both backgrounds.
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    idle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    disconnected: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30",
    terminated: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    expired: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30",
    banned: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    revoked: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    suspended: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    unclaimed: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    draft: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30",
    disabled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    connected: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    error: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    cooldown: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    blocked: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        map[status] ?? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30"
      )}
    >
      <StatusDot status={status} className="!w-1 !h-1" />
      <span className="capitalize">{status}</span>
    </span>
  );
}
