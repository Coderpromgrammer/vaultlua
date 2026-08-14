"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Shield, Users, FolderKanban, Radio, Gift, Activity, AlertTriangle,
  Settings as SettingsIcon, Power, Search, ChevronRight,
} from "lucide-react";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { navigate } from "@/lib/router";

export function AdminView() {
  const { user } = useAuth();
  const [role, setRole] = useState<string>("creator");
  useEffect(() => {
    if (!user) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => setRole(j?.data?.role ?? "creator"))
      .catch(() => {});
  }, [user]);
  const isAdmin = role === "admin" || role === "owner";

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin");
      const j = await r.json();
      return j?.data;
    },
  });

  if (!isAdmin) {
    return (
      <Card className="glass-panel">
        <EmptyState
          icon={Shield}
          title="Admin access required"
          description="You don't have permission to view this page. Contact an owner if you believe this is an error."
          action={<Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="System-wide administration. Every action is recorded in the audit log."
        actions={<Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30 capitalize">{role}</Badge>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total users" value={stats?.users ?? 0} icon={Users} accent="violet" />
        <StatCard label="Projects" value={stats?.projects ?? 0} icon={FolderKanban} accent="cyan" />
        <StatCard label="Scripts" value={stats?.scripts ?? 0} icon={Activity} accent="emerald" />
        <StatCard label="Active sessions" value={stats?.sessions ?? 0} icon={Radio} accent="amber" />
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-muted/30 border border-border/60 h-9 p-1">
          <TabsTrigger value="audit" className="text-xs">Audit log</TabsTrigger>
          <TabsTrigger value="system" className="text-xs">System settings</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs">Feature flags</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="flags">
          <FeatureFlags />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditLog() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", search],
    queryFn: async () => {
      const r = await fetch(`/api/admin/audit?pageSize=100${search ? `&action=${encodeURIComponent(search)}` : ""}`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  return (
    <Card className="glass-panel overflow-hidden">
      <div className="p-3 border-b border-border/60 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter by action (e.g. key.create, session.terminate)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 h-7"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="text-xs">Actor</TableHead>
            <TableHead className="text-xs">Action</TableHead>
            <TableHead className="text-xs">Project</TableHead>
            <TableHead className="text-xs">Target</TableHead>
            <TableHead className="text-xs">IP</TableHead>
            <TableHead className="text-xs">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={6}><div className="h-6 shimmer rounded" /></TableCell></TableRow>
            ))
          ) : !data || data.length === 0 ? (
            <TableRow><TableCell colSpan={6}><EmptyState icon={Activity} title="No audit entries" /></TableCell></TableRow>
          ) : (
            data.slice(0, 50).map((log: any) => (
              <TableRow key={log.id} className="border-border/40 hover:bg-muted/30">
                <TableCell className="text-xs">
                  <div className="font-medium">{log.actor?.displayName ?? "System"}</div>
                  <div className="text-[10px] text-muted-foreground">{log.actor?.username ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-mono bg-violet-500/10 text-violet-300 border-violet-500/20">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{log.project?.name ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.target ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function SystemSettings() {
  const { data: settings, refetch } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const r = await fetch("/api/admin/system");
      const j = await r.json();
      return j?.data ?? {};
    },
  });

  const [starterPrice, setStarterPrice] = useState("9");
  const [proPrice, setProPrice] = useState("29");
  const [scalePrice, setScalePrice] = useState("99");

  useState(() => {
    if (settings) {
      setStarterPrice(String(settings["pricing.starter"]?.monthly ?? "9"));
      setProPrice(String(settings["pricing.pro"]?.monthly ?? "29"));
      setScalePrice(String(settings["pricing.scale"]?.monthly ?? "99"));
    }
  });

  const savePricing = async () => {
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "pricing.starter",
        value: { monthly: parseInt(starterPrice, 10), yearly: parseInt(starterPrice, 10) * 10, projects: 3, keys: 500, sessions: 500 },
        scope: "pricing",
      }),
    });
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "pricing.pro",
        value: { monthly: parseInt(proPrice, 10), yearly: parseInt(proPrice, 10) * 10, projects: 25, keys: 10000, sessions: 20000 },
        scope: "pricing",
      }),
    });
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "pricing.scale",
        value: { monthly: parseInt(scalePrice, 10), yearly: parseInt(scalePrice, 10) * 10, projects: -1, keys: -1, sessions: -1 },
        scope: "pricing",
      }),
    });
    toast.success("Pricing updated");
    refetch();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Pricing configuration</h3>
        <p className="text-xs text-muted-foreground mb-4">Prices are stored in system settings and consumed by the landing page.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Starter ($/mo)</Label>
            <Input type="number" value={starterPrice} onChange={(e) => setStarterPrice(e.target.value)} className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label>Pro ($/mo)</Label>
            <Input type="number" value={proPrice} onChange={(e) => setProPrice(e.target.value)} className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label>Scale ($/mo)</Label>
            <Input type="number" value={scalePrice} onChange={(e) => setScalePrice(e.target.value)} className="bg-muted/40" />
          </div>
        </div>
        <Button className="mt-4 bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={savePricing}>
          Save pricing
        </Button>
      </Card>
    </div>
  );
}

function FeatureFlags() {
  const { data: settings, refetch } = useQuery({
    queryKey: ["system-settings-flags"],
    queryFn: async () => {
      const r = await fetch("/api/admin/system");
      const j = await r.json();
      return j?.data ?? {};
    },
  });

  const flags = [
    { key: "feature.discord_bot", label: "Discord bot", description: "Enable Discord integration UI for all creators" },
    { key: "feature.reward_links", label: "Reward links", description: "Enable public reward/ad flow" },
    { key: "feature.api_v1", label: "REST API v1", description: "Public API endpoints for integrations" },
    { key: "feature.realtime_sessions", label: "Realtime sessions", description: "WebSocket-based live session updates" },
  ];

  const toggle = async (key: string, current: boolean) => {
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: !current, scope: "feature_flag" }),
    });
    toast.success(`Flag ${!current ? "enabled" : "disabled"}`);
    refetch();
  };

  return (
    <Card className="glass-panel p-5">
      <h3 className="font-semibold text-sm mb-1">Feature flags</h3>
      <p className="text-xs text-muted-foreground mb-4">Toggle platform features without redeploying.</p>
      <div className="space-y-2">
        {flags.map((f) => {
          const value = settings[f.key] === true || settings[f.key] === "true";
          return (
            <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div>
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.description}</div>
              </div>
              <Switch checked={value} onCheckedChange={() => toggle(f.key, value)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MaintenanceMode() {
  const { data: settings, refetch } = useQuery({
    queryKey: ["system-settings-maintenance"],
    queryFn: async () => {
      const r = await fetch("/api/admin/system");
      const j = await r.json();
      return j?.data ?? {};
    },
  });

  const enabled = settings["maintenance.enabled"] === true || settings["maintenance.enabled"] === "true";

  const toggle = async () => {
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "maintenance.enabled", value: !enabled, scope: "maintenance" }),
    });
    toast.success(`Maintenance mode ${!enabled ? "enabled" : "disabled"}`, {
      description: !enabled ? "Non-admin users will see a maintenance page." : "Platform is back to normal.",
    });
    refetch();
  };

  return (
    <Card className={`glass-panel p-5 ${enabled ? "border-amber-500/40" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Power className="w-4 h-4" />
            Maintenance mode
          </h3>
          <p className="text-xs text-muted-foreground max-w-md">
            When enabled, all non-admin users see a maintenance page. API requests return 503. Admins retain full access.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>
      {enabled && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span className="text-xs text-amber-200">Maintenance mode is currently active for all non-admin users.</span>
        </div>
      )}
    </Card>
  );
}
