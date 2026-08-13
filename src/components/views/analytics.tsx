"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Activity, Users, KeyRound, Gift } from "lucide-react";
import { PageHeader, StatCard } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export function AnalyticsView() {
  const [range, setRange] = useState("7d");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const r = await fetch(`/api/analytics?range=${range}`);
      const j = await r.json();
      return j?.data;
    },
  });

  const t = data?.totals;
  const series = data?.series ?? [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Deep-dive into your platform metrics. All numbers are aggregated across every project you can access."
        actions={
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/60">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  range === r.value
                    ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total requests" value={t?.totalRequests ?? 0} icon={Activity} accent="violet" delta={12.4} loading={isLoading} />
        <StatCard label="Successful" value={t?.successfulRequests ?? 0} icon={TrendingUp} accent="emerald" delta={8.1} loading={isLoading} />
        <StatCard label="Failed" value={t?.failedRequests ?? 0} icon={TrendingDown} accent="rose" delta={-3.2} loading={isLoading} />
        <StatCard label="Active users" value={t?.activeUsers ?? 0} icon={Users} accent="cyan" delta={18.6} loading={isLoading} />
        <StatCard label="Keys created" value={t?.keysCreated ?? 0} icon={KeyRound} accent="violet" loading={isLoading} />
        <StatCard label="Keys redeemed" value={t?.keysRedeemed ?? 0} icon={KeyRound} accent="amber" loading={isLoading} />
        <StatCard label="Rewards completed" value={t?.rewardsCompleted ?? 0} icon={Gift} accent="emerald" delta={22.4} loading={isLoading} />
        <StatCard label="Conversion rate" value={`${t?.rewardConversionRate ?? 0}%`} icon={TrendingUp} accent="cyan" loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Daily requests</h3>
              <p className="text-xs text-muted-foreground">Successful vs failed</p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              {t?.successfulRequests && t?.totalRequests
                ? `${((t.successfulRequests / Math.max(1, t.totalRequests)) * 100).toFixed(1)}% success`
                : "—"}
            </Badge>
          </div>
          <div className="h-72">
            {isLoading ? <div className="h-full w-full shimmer rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="a-ok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="a-fail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.22 18)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.65 0.22 18)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.02 265 / 0.95)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="successful" stroke="oklch(0.7 0.16 155)" strokeWidth={2} fill="url(#a-ok)" />
                  <Area type="monotone" dataKey="failed" stroke="oklch(0.65 0.22 18)" strokeWidth={2} fill="url(#a-fail)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-1">Sessions & keys</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily series over the selected range</p>
          <div className="h-72">
            {isLoading ? <div className="h-full w-full shimmer rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.02 265 / 0.95)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="sessions" fill="oklch(0.7 0.16 200)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="keys" fill="oklch(0.78 0.18 75)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass-panel p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-1">Reward conversion</h3>
          <p className="text-xs text-muted-foreground mb-4">Started vs completed reward sessions</p>
          <div className="h-64">
            {isLoading ? <div className="h-full w-full shimmer rounded" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.02 265 / 0.95)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="rewards" stroke="oklch(0.7 0.16 155)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="keys" stroke="oklch(0.78 0.18 75)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-1">Key status distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">All keys across your projects</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: t?.keysRedeemed ?? 100, color: "oklch(0.7 0.16 155)" },
                    { name: "Expired", value: t?.keysExpired ?? 40, color: "oklch(0.65 0.02 260)" },
                    { name: "Created", value: t?.keysCreated ?? 30, color: "oklch(0.7 0.19 285)" },
                  ]}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {[
                    { name: "Active", value: t?.keysRedeemed ?? 100, color: "oklch(0.7 0.16 155)" },
                    { name: "Expired", value: t?.keysExpired ?? 40, color: "oklch(0.65 0.02 260)" },
                    { name: "Created", value: t?.keysCreated ?? 30, color: "oklch(0.7 0.19 285)" },
                  ].map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 265 / 0.95)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] mt-2">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "oklch(0.7 0.16 155)" }} />Active</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "oklch(0.65 0.02 260)" }} />Expired</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "oklch(0.7 0.19 285)" }} />New</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
