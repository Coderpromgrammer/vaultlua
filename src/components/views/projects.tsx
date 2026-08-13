"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter, navigate } from "@/lib/router";
import {
  Plus, Search, MoreHorizontal, FolderKanban, Users, KeyRound,
  Radio, FileCode2, Settings, BarChart3, Gift, Trash2, Edit3,
  ExternalLink, Copy, Check,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProjectsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(
    router.query.get("new") === "1"
  );
  const { data, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: async () => {
      const r = await fetch(`/api/projects?search=${encodeURIComponent(search)}&pageSize=100`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  const projects = data ?? [];

  // Single project detail view
  if (router.segments.length >= 2 && router.segments[0] === "projects") {
    return <ProjectDetail projectId={router.segments[1]} />;
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Your script licensing projects. Each project is fully isolated with its own keys, sessions, and analytics."
        actions={
          <>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48 md:w-64 bg-muted/40 border-border/60"
              />
            </div>
            <Button
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New project
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-panel p-5 h-44">
              <div className="h-full w-full shimmer rounded" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="glass-panel">
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start licensing and distributing your scripts."
            action={
              <Button
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create project
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any, i: number) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function ProjectCard({ project, index }: { project: any; index: number }) {
  const [copied, setCopied] = useState(false);
  const copyIdentifier = () => {
    navigator.clipboard.writeText(project.identifier);
    setCopied(true);
    toast.success("Project identifier copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card
        className="glass-panel p-5 h-full hover:border-violet-500/40 transition-colors group cursor-pointer"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 grid place-items-center shrink-0 ring-1 ring-border/60">
              <FolderKanban className="w-5 h-5 text-violet-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{project.name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyIdentifier();
                }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-violet-300 font-mono"
              >
                {project.identifier}
                {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}?tab=settings`)}>
                <Settings className="w-3.5 h-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyIdentifier}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy identifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-300">
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">
          {project.description ?? "No description provided."}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <StatusBadge status={project.status} />
          <Badge variant="outline" className="text-[10px] capitalize">
            {project.visibility}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/40">
          {[
            { label: "Scripts", value: project._count?.scripts ?? 0, icon: FileCode2 },
            { label: "Keys", value: project._count?.licenses ?? 0, icon: KeyRound },
            { label: "Sessions", value: project._count?.sessions ?? 0, icon: Radio },
            { label: "Members", value: project._count?.members ?? 0, icon: Users },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-sm font-semibold tabular-nums">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name || name.length < 2) {
      toast.error("Name too short");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, visibility }),
      });
      const j = await r.json();
      if (j?.success) {
        toast.success("Project created", { description: `${name} is ready to go.` });
        qc.invalidateQueries({ queryKey: ["projects"] });
        setName("");
        setDescription("");
        onOpenChange(false);
        navigate(`/projects/${j.data.id}`);
      } else {
        toast.error(j?.error?.message ?? "Failed to create project");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name"
              placeholder="e.g. Phantom Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/40"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description (optional)</Label>
            <Textarea
              id="proj-desc"
              placeholder="What does this project license? Who is it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/40 resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVisibility("private")}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  visibility === "private"
                    ? "bg-violet-500/10 border-violet-500/40"
                    : "bg-muted/30 border-border/60 hover:bg-muted/50"
                )}
              >
                <div className="text-xs font-medium mb-0.5">Private</div>
                <div className="text-[10px] text-muted-foreground">Only members can access</div>
              </button>
              <button
                onClick={() => setVisibility("public")}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  visibility === "public"
                    ? "bg-violet-500/10 border-violet-500/40"
                    : "bg-muted/30 border-border/60 hover:bg-muted/50"
                )}
              >
                <div className="text-xs font-medium mb-0.5">Public</div>
                <div className="text-[10px] text-muted-foreground">Read-only for signed-in users</div>
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
            disabled={creating}
            onClick={create}
          >
            {creating ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const initialTab = router.query.get("tab") ?? "overview";
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      const j = await r.json();
      return j?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 w-64 shimmer rounded" />
        <div className="h-96 shimmer rounded" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="glass-panel">
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="You don't have access to this project, or it has been archived."
          action={<Button onClick={() => navigate("/projects")}>Back to projects</Button>}
        />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description}
        breadcrumb={
          <button
            onClick={() => navigate("/projects")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Projects
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground">{project.name}</span>
          </button>
        }
        actions={
          <>
            <Badge variant="outline" className="font-mono text-[10px]">
              {project.identifier}
            </Badge>
            <StatusBadge status={project.status} />
          </>
        }
      />

      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="bg-muted/30 border border-border/60 h-9 p-1 overflow-x-auto max-w-full">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="scripts" className="text-xs">Scripts</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
          <TabsTrigger value="keys" className="text-xs">Keys</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs">Rewards</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverviewTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="scripts">
          <ProjectScriptsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="users">
          <ProjectUsersTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="keys">
          <ProjectKeysTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="sessions">
          <ProjectSessionsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="rewards">
          <ProjectRewardsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="analytics">
          <ProjectAnalyticsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="settings">
          <ProjectSettingsTab projectId={projectId} project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectOverviewTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-stats", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/stats`);
      const j = await r.json();
      return j?.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Scripts", value: data?.totals.scripts ?? 0, icon: FileCode2, accent: "from-violet-500/20 to-fuchsia-500/10 text-violet-300" },
          { label: "Active Keys", value: data?.totals.activeLicenses ?? 0, icon: KeyRound, accent: "from-cyan-500/20 to-blue-500/10 text-cyan-300" },
          { label: "Active Sessions", value: data?.totals.activeSessions ?? 0, icon: Radio, accent: "from-emerald-500/20 to-teal-500/10 text-emerald-300" },
          { label: "Total Users", value: data?.totals.users ?? 0, icon: Users, accent: "from-amber-500/20 to-orange-500/10 text-amber-300" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br grid place-items-center", s.accent)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {isLoading ? <span className="inline-block w-12 h-6 shimmer rounded" /> : s.value}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Activity</h3>
        <p className="text-xs text-muted-foreground mb-4">Last 14 days</p>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full w-full shimmer rounded" />
          ) : (
            <ResponsiveContainerMulti data={data?.series ?? []} />
          )}
        </div>
      </Card>
    </div>
  );
}

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

function ResponsiveContainerMulti({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="ov-req" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ov-sess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.16 200)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="oklch(0.7 0.16 200)" stopOpacity={0} />
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
        <Area type="monotone" dataKey="requests" stroke="oklch(0.7 0.19 285)" strokeWidth={2} fill="url(#ov-req)" />
        <Area type="monotone" dataKey="sessions" stroke="oklch(0.7 0.16 200)" strokeWidth={2} fill="url(#ov-sess)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Lightweight inline tabs for project detail
function ProjectScriptsTab({ projectId }: { projectId: string }) {
  return <InlineScriptList projectId={projectId} />;
}
function ProjectUsersTab({ projectId }: { projectId: string }) {
  return <InlineUserList projectId={projectId} />;
}
function ProjectKeysTab({ projectId }: { projectId: string }) {
  return <InlineKeyList projectId={projectId} />;
}
function ProjectSessionsTab({ projectId }: { projectId: string }) {
  return <InlineSessionList projectId={projectId} />;
}
function ProjectRewardsTab({ projectId }: { projectId: string }) {
  return <InlineRewardsConfig projectId={projectId} />;
}
function ProjectAnalyticsTab({ projectId }: { projectId: string }) {
  return <InlineAnalytics projectId={projectId} />;
}
function ProjectSettingsTab({ projectId, project }: { projectId: string; project: any }) {
  return <InlineProjectSettings projectId={projectId} project={project} />;
}

// Import the inline list components — these reuse logic from the main views
import { InlineScriptList, InlineUserList, InlineKeyList, InlineSessionList, InlineRewardsConfig, InlineAnalytics, InlineProjectSettings } from "@/components/views/inline-tabs";
