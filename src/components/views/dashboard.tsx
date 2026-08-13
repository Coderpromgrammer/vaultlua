"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  FolderKanban, FileCode2, Users, Radio, KeyRound,
  Gift, Activity, AlertTriangle,
  TrendingUp, Clock, ArrowRight, type LucideIcon,
} from "lucide-react";
import { StatCard, PageHeader, StatusBadge } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navigate } from "@/lib/router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart,
} from "recharts";
import { motion } from "framer-motion";

interface OverviewData {
  totals: {
    scripts: number;
    licenses: number;
    sessions: number;
    users: number;
    activeSessions: number;
    activeLicenses: number;
    expiredLicenses: number;
    rewardCompletions: number;
    todayRequests: number;
  };
  series: { date: string; requests: number; sessions: number; keys: number; rewards: number }[];
}

export function DashboardView() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      // Aggregate across all accessible projects
      const r = await fetch("/api/analytics?range=14d");
      const j = await r.json();
      const totals = j.data.totals;
      return {
        totals: {
          scripts: 0,
          licenses: totals.totalLicenses,
          sessions: totals.activeSessions,
          users: totals.activeUsers,
          activeSessions: totals.activeSessions,
          activeLicenses: totals.keysCreated, // approximate
          expiredLicenses: totals.keysExpired,
          rewardCompletions: totals.rewardsCompleted,
          todayRequests: totals.totalRequests,
        },
        series: j.data.series,
      };
    },
    refetchInterval: 30_000,
  });

  // Also fetch projects count
  const { data: projectsData } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects?pageSize=1");
      const j = await r.json();
      return j;
    },
  });

  const totalProjects = projectsData?.pagination?.total ?? 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${(session?.user as any)?.displayName?.split(" ")[0] ?? "creator"}`}
        description="Here's what's happening across your projects today."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Analytics
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              onClick={() => navigate("/projects?new=1")}
            >
              New project
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          accent="violet"
          delta={4.2}
          loading={isLoading}
        />
        <StatCard
          label="Active Sessions"
          value={data?.totals.activeSessions ?? 0}
          icon={Radio}
          accent="emerald"
          delta={12.4}
          loading={isLoading}
        />
        <StatCard
          label="Valid Keys"
          value={data?.totals.activeLicenses ?? 0}
          icon={KeyRound}
          accent="cyan"
          delta={3.1}
          loading={isLoading}
        />
        <StatCard
          label="Today's Requests"
          value={data?.totals.todayRequests ?? 0}
          icon={Activity}
          accent="amber"
          delta={-2.4}
          loading={isLoading}
        />
        <StatCard
          label="Total Scripts"
          value={data?.totals.scripts || 0}
          icon={FileCode2}
          accent="violet"
          loading={isLoading}
        />
        <StatCard
          label="Active Users"
          value={data?.totals.users ?? 0}
          icon={Users}
          accent="cyan"
          delta={8.7}
          loading={isLoading}
        />
        <StatCard
          label="Expired Keys"
          value={data?.totals.expiredLicenses ?? 0}
          icon={KeyRound}
          accent="rose"
          loading={isLoading}
        />
        <StatCard
          label="Reward Completions"
          value={data?.totals.rewardCompletions ?? 0}
          icon={Gift}
          accent="emerald"
          delta={18.3}
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="glass-panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Requests over time</h3>
              <p className="text-xs text-muted-foreground">Last 14 days · all projects</p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.4%
            </Badge>
          </div>
          <div className="h-64">
            {isLoading ? (
              <div className="h-full w-full shimmer rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
                  <defs>
                    <linearGradient id="req-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.65 0.02 260)"
                    fontSize={10}
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0.02 265 / 0.95)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      backdropFilter: "blur(20px)",
                    }}
                    labelStyle={{ color: "oklch(0.96 0.005 260)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="oklch(0.7 0.19 285)"
                    strokeWidth={2}
                    fill="url(#req-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-1">Active sessions</h3>
          <p className="text-xs text-muted-foreground mb-4">Real-time · auto-refreshing</p>
          <div className="h-64">
            {isLoading ? (
              <div className="h-full w-full shimmer rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.series?.slice(-7) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.65 0.02 260)"
                    fontSize={10}
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0.02 265 / 0.95)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    fill="oklch(0.7 0.16 200)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-1">Key creation</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 14 days</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.02 265 / 0.95)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="keys"
                  stroke="oklch(0.78 0.18 75)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <h3 className="font-semibold text-sm mb-1">Reward completions</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 14 days</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="rew-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.02 265 / 0.95)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rewards"
                  stroke="oklch(0.7 0.16 155)"
                  strokeWidth={2}
                  fill="url(#rew-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Recent activity</h3>
              <p className="text-xs text-muted-foreground">From audit log</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              View all
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <ScrollArea className="h-40">
            <RecentActivity />
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

function RecentActivity() {
  const { data } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const r = await fetch("/api/admin/audit?pageSize=8");
      const j = await r.json();
      return j?.data ?? [];
    },
  });
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-6">
        No recent activity
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((item: any) => (
        <div key={item.id} className="flex items-start gap-2.5 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="leading-tight">
              <span className="font-medium">{item.actor?.displayName ?? "System"}</span>{" "}
              <span className="text-muted-foreground">{item.action.replace(/\./g, " ")}</span>
              {item.project && (
                <span className="text-muted-foreground"> · {item.project.name}</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
