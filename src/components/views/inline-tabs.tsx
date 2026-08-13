"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus, Search, MoreHorizontal, FileCode2, KeyRound, Users,
  Radio, Gift, BarChart3, Settings, Trash2, Edit3, Ban,
  RotateCcw, Clock, ArrowUp, ArrowDown, Copy, Check,
  Play, Pause, Eye, Power, ChevronRight, X,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/router";

// ────────────────────────────────────────────────────────────────────────────
// Inline script list (used in project detail tabs)
// ────────────────────────────────────────────────────────────────────────────
export function InlineScriptList({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["scripts", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/scripts?projectId=${projectId}&pageSize=100`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });
  const [publishScript, setPublishScript] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Scripts in this project</h3>
          <p className="text-xs text-muted-foreground">Publish new versions without manually updating every license.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add script
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-panel p-4 h-16">
              <div className="h-full w-full shimmer rounded" />
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="glass-panel">
          <EmptyState
            icon={FileCode2}
            title="No scripts yet"
            description="Add your first script to start licensing it."
            action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Add script</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((s: any) => (
            <Card key={s.id} className="glass-panel p-4 flex items-center gap-4 hover:border-violet-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 grid place-items-center shrink-0">
                <FileCode2 className="w-4 h-4 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-medium truncate">{s.name}</h4>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.description ?? "No description"}</p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="font-mono font-semibold text-violet-300">v{s.currentVersion}</div>
                  <div className="text-[10px] text-muted-foreground">current</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold tabular-nums">{s._count?.versions ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">versions</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold tabular-nums">{s._count?.sessions ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">sessions</div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPublishScript(s)}>
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Publish new version
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-rose-300">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <PublishDialog script={publishScript} onClose={() => setPublishScript(null)} />
      <CreateScriptDialog projectId={projectId} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function PublishDialog({ script, onClose }: { script: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [payload, setPayload] = useState("-- Your Luau source here\nlocal function main()\n  print('Hello from VaultLua')\nend\n\nmain()");

  // Pre-fill suggested version
  useState(() => {
    if (script) {
      const [maj, min, pat] = (script.currentVersion ?? "1.0.0").split(".").map(Number);
      setVersion(`${maj}.${min}.${pat + 1}`);
    }
  });

  const publish = async () => {
    if (!script) return;
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      toast.error("Version must be in x.y.z format");
      return;
    }
    try {
      const r = await fetch(`/api/scripts/${script.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, changelog, payload }),
      });
      const j = await r.json();
      if (j?.success) {
        toast.success(`Published v${version}`, { description: "All active licenses now resolve to this version." });
        qc.invalidateQueries({ queryKey: ["scripts"] });
        onClose();
        setVersion("");
        setChangelog("");
      } else {
        toast.error(j?.error?.message ?? "Failed to publish");
      }
    } catch (e) {
      toast.error("Failed to publish");
    }
  };

  return (
    <Dialog open={!!script} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-panel-strong max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish new version · {script?.name}</DialogTitle>
          <DialogDescription>
            Publishing a new version instantly updates every active license to use it. Versions are immutable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version (semver)</Label>
              <Input id="version" placeholder="1.2.0" value={version} onChange={(e) => setVersion(e.target.value)} className="bg-muted/40 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Previous version</Label>
              <Input value={`v${script?.currentVersion ?? "—"}`} disabled className="bg-muted/20 font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog</Label>
            <Textarea
              id="changelog"
              placeholder="What changed in this version?"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="bg-muted/40 resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payload">Script payload (Luau)</Label>
            <Textarea
              id="payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="bg-muted/40 font-mono text-xs resize-none"
              rows={8}
            />
            <p className="text-[10px] text-muted-foreground">
              {payload.length.toLocaleString()} characters · stored server-side · never exposed to the browser
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={publish}>
            Publish version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateScriptDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = async () => {
    if (!name) return toast.error("Name required");
    const r = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name, description }),
    });
    const j = await r.json();
    if (j?.success) {
      toast.success("Script created", { description: "Publish a version to make it available." });
      qc.invalidateQueries({ queryKey: ["scripts", projectId] });
      setName("");
      setDescription("");
      onOpenChange(false);
    } else {
      toast.error(j?.error?.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong">
        <DialogHeader>
          <DialogTitle>Add a script</DialogTitle>
          <DialogDescription>Scripts are versioned containers for your Luau payloads.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Script name</Label>
            <Input placeholder="e.g. Phantom Hub — Auto Farm" value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/40" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea placeholder="What does this script do?" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/40 resize-none" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={create}>Create script</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline key list
// ────────────────────────────────────────────────────────────────────────────
export function InlineKeyList({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genOpen, setGenOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["keys", projectId, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ projectId, search, pageSize: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const r = await fetch(`/api/keys?${params}`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  const keys = data ?? [];
  const allChecked = keys.length > 0 && selected.length === keys.length;

  const toggleAll = () => setSelected(allChecked ? [] : keys.map((k: any) => k.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const bulkAction = async (action: string) => {
    if (selected.length === 0) return;
    for (const id of selected) {
      await fetch(`/api/keys/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    }
    toast.success(`Action applied to ${selected.length} keys`);
    setSelected([]);
    qc.invalidateQueries({ queryKey: ["keys", projectId] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">License keys</h3>
          <p className="text-xs text-muted-foreground">Generate, revoke, ban, extend, transfer, reset HWID.</p>
        </div>
        <Button size="sm" onClick={() => setGenOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Generate keys
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by key…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/40" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unclaimed">Unclaimed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
          <span className="text-xs font-medium">{selected.length} selected</span>
          <div className="h-4 w-px bg-border/60" />
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("ban")}>Ban</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("unban")}>Unban</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("suspend")}>Suspend</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("unsuspend")}>Unsuspend</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-300" onClick={() => {
            selected.forEach((id) => fetch(`/api/keys/${id}`, { method: "DELETE" }));
            toast.success(`${selected.length} keys revoked`);
            setSelected([]);
            qc.invalidateQueries({ queryKey: ["keys", projectId] });
          }}>Revoke all</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      <Card className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-border/60 bg-transparent" />
              </TableHead>
              <TableHead className="text-xs">Key</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">HWID</TableHead>
              <TableHead className="text-xs">Expires</TableHead>
              <TableHead className="text-xs">Last used</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><div className="h-6 shimmer rounded" /></TableCell>
                </TableRow>
              ))
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState icon={KeyRound} title="No keys found" description="Generate your first batch of license keys." />
                </TableCell>
              </TableRow>
            ) : (
              keys.map((k: any) => (
                <KeyRow key={k.id} k={k} projectId={projectId} selected={selected.includes(k.id)} onToggle={() => toggleOne(k.id)} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <GenerateKeysDialog projectId={projectId} open={genOpen} onOpenChange={setGenOpen} />
    </div>
  );
}

function KeyRow({ k, projectId, selected, onToggle }: { k: any; projectId: string; selected: boolean; onToggle: () => void }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(k.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const action = async (action: string) => {
    const r = await fetch(`/api/keys/${k.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (r.ok) {
      toast.success(`Key ${action} applied`);
      qc.invalidateQueries({ queryKey: ["keys", projectId] });
    }
  };

  const resetHwid = async () => {
    const r = await fetch(`/api/keys/${k.id}/reset-hwid`, { method: "POST" });
    if (r.ok) {
      toast.success("HWID reset");
      qc.invalidateQueries({ queryKey: ["keys", projectId] });
    }
  };

  const revoke = async () => {
    const r = await fetch(`/api/keys/${k.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Key revoked");
      qc.invalidateQueries({ queryKey: ["keys", projectId] });
    }
  };

  return (
    <TableRow className="border-border/40 hover:bg-muted/30">
      <TableCell>
        <input type="checkbox" checked={selected} onChange={onToggle} className="rounded border-border/60 bg-transparent" />
      </TableCell>
      <TableCell>
        <button onClick={copy} className="flex items-center gap-1.5 font-mono text-xs hover:text-violet-300">
          <span className="tabular-nums">{k.key.slice(0, 23)}…</span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
        {k.note && <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-32">{k.note}</p>}
      </TableCell>
      <TableCell><StatusBadge status={k.status} /></TableCell>
      <TableCell className="text-xs">
        {k.hwid ? (
          <span className="font-mono text-muted-foreground">{k.hwid.slice(0, 8)}…</span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Lifetime"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copy}><Copy className="w-3.5 h-3.5 mr-2" />Copy full key</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExtendOpen(true)}><Clock className="w-3.5 h-3.5 mr-2" />Extend / shorten</DropdownMenuItem>
            <DropdownMenuItem onClick={resetHwid}><RotateCcw className="w-3.5 h-3.5 mr-2" />Reset HWID</DropdownMenuItem>
            <DropdownMenuSeparator />
            {k.status === "banned" ? (
              <DropdownMenuItem onClick={() => action("unban")}>Unban</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => action("ban")} className="text-rose-300"><Ban className="w-3.5 h-3.5 mr-2" />Ban</DropdownMenuItem>
            )}
            {k.status === "suspended" ? (
              <DropdownMenuItem onClick={() => action("unsuspend")}>Unsuspend</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => action("suspend")}>Suspend</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={revoke} className="text-rose-300"><Trash2 className="w-3.5 h-3.5 mr-2" />Revoke</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function GenerateKeysDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [count, setCount] = useState("1");
  const [duration, setDuration] = useState("7");
  const [maxSessions, setMaxSessions] = useState("1");
  const [note, setNote] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);

  const generate = async () => {
    const durationDays = duration === "lifetime" ? null : parseInt(duration, 10);
    const r = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        count: parseInt(count, 10),
        durationDays,
        maxSessions: parseInt(maxSessions, 10),
        note: note || undefined,
      }),
    });
    const j = await r.json();
    if (j?.success) {
      setGenerated(j.data.keys.map((k: any) => k.key));
      toast.success(`Generated ${j.data.count} keys`);
      qc.invalidateQueries({ queryKey: ["keys", projectId] });
    } else {
      toast.error(j?.error?.message ?? "Failed");
    }
  };

  const close = () => {
    onOpenChange(false);
    setGenerated([]);
    setCount("1");
    setDuration("7");
    setMaxSessions("1");
    setNote("");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generated.join("\n"));
    toast.success("All keys copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="glass-panel-strong max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate license keys</DialogTitle>
          <DialogDescription>
            Keys are generated server-side with cryptographic randomness. The raw key is shown once on creation.
          </DialogDescription>
        </DialogHeader>
        {generated.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Count</Label>
                <Input type="number" min={1} max={500} value={count} onChange={(e) => setCount(e.target.value)} className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max concurrent sessions</Label>
                <Input type="number" min={1} max={10} value={maxSessions} onChange={(e) => setMaxSessions(e.target.value)} className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input placeholder="e.g. Giveaway batch" value={note} onChange={(e) => setNote(e.target.value)} className="bg-muted/40" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{generated.length} keys generated</p>
              <Button size="sm" variant="outline" onClick={copyAll}><Copy className="w-3.5 h-3.5 mr-1.5" />Copy all</Button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-2 space-y-1">
              {generated.map((k, i) => (
                <div key={i} className="flex items-center justify-between font-mono text-xs px-2 py-1 rounded hover:bg-muted/40">
                  <span className="tabular-nums">{k}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(k); toast.success("Copied"); }}
                    className="text-muted-foreground hover:text-violet-300"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-300/80 flex items-center gap-1.5">
              <Ban className="w-3 h-3" />
              These keys will not be shown again in plaintext. Copy them now.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>{generated.length === 0 ? "Cancel" : "Done"}</Button>
          {generated.length === 0 && (
            <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={generate}>
              Generate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline user list
// ────────────────────────────────────────────────────────────────────────────
export function InlineUserList({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["users", projectId, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ projectId, search, pageSize: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const r = await fetch(`/api/users?${params}`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  const act = async (userId: string, action: string) => {
    const r = await fetch(`/api/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, projectId }),
    });
    if (r.ok) {
      toast.success(`Action applied`);
      qc.invalidateQueries({ queryKey: ["users", projectId] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">End users</h3>
        <p className="text-xs text-muted-foreground">Users who have claimed keys for this project.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/40" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">HWID</TableHead>
              <TableHead className="text-xs">Licenses</TableHead>
              <TableHead className="text-xs">Sessions</TableHead>
              <TableHead className="text-xs">Last seen</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><div className="h-6 shimmer rounded" /></TableCell></TableRow>
              ))
            ) : !data || data.length === 0 ? (
              <TableRow><TableCell colSpan={7}><EmptyState icon={Users} title="No users yet" description="Users appear here once they claim a license key." /></TableCell></TableRow>
            ) : (
              data.map((u: any) => (
                <TableRow key={u.id} className="border-border/40 hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 grid place-items-center text-[10px] font-medium text-white">
                        {(u.displayName ?? u.identifier).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{u.displayName ?? u.identifier}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{u.identifier}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-xs font-mono">
                    {u.hwid ? <span className="text-muted-foreground">{u.hwid.slice(0, 8)}…</span> : <span className="text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{u._count?.licenses ?? 0}</TableCell>
                  <TableCell className="text-xs tabular-nums">{u._count?.sessions ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.lastSeenAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => act(u.id, "reset_hwid")}><RotateCcw className="w-3.5 h-3.5 mr-2" />Reset HWID</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => act(u.id, "terminate_sessions")}><Power className="w-3.5 h-3.5 mr-2" />Terminate sessions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.status === "banned" ? (
                          <DropdownMenuItem onClick={() => act(u.id, "unban")}>Unban</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => act(u.id, "ban")} className="text-rose-300"><Ban className="w-3.5 h-3.5 mr-2" />Ban</DropdownMenuItem>
                        )}
                        {u.status === "suspended" ? (
                          <DropdownMenuItem onClick={() => act(u.id, "unsuspend")}>Unsuspend</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => act(u.id, "suspend")}>Suspend</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline session list
// ────────────────────────────────────────────────────────────────────────────
export function InlineSessionList({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", projectId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ projectId, pageSize: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const r = await fetch(`/api/sessions?${params}`);
      const j = await r.json();
      return j?.data ?? [];
    },
    refetchInterval: 10_000,
  });

  const terminate = async (id: string) => {
    const r = await fetch(`/api/sessions/${id}/terminate`, { method: "POST" });
    if (r.ok) {
      toast.success("Session terminated");
      qc.invalidateQueries({ queryKey: ["sessions", projectId] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Active sessions</h3>
          <p className="text-xs text-muted-foreground">Auto-refreshing every 10 seconds.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Script</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Device</TableHead>
              <TableHead className="text-xs">Started</TableHead>
              <TableHead className="text-xs">Last heartbeat</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><div className="h-6 shimmer rounded" /></TableCell></TableRow>
              ))
            ) : !data || data.length === 0 ? (
              <TableRow><TableCell colSpan={7}><EmptyState icon={Radio} title="No sessions" description="Active script execution sessions will appear here." /></TableCell></TableRow>
            ) : (
              data.map((s: any) => (
                <TableRow key={s.id} className="border-border/40 hover:bg-muted/30">
                  <TableCell className="text-xs">
                    <div className="font-medium">{s.endUser?.displayName ?? s.endUser?.identifier ?? "—"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.license?.key?.slice(0, 18)}…</div>
                  </TableCell>
                  <TableCell className="text-xs">{s.script?.name ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.deviceInfo ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.startedAt).toLocaleTimeString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.lastHeartbeat).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    {(s.status === "active" || s.status === "idle") && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-300" onClick={() => terminate(s.id)}>
                        Terminate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline rewards config
// ────────────────────────────────────────────────────────────────────────────
export function InlineRewardsConfig({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: providers } = useQuery({
    queryKey: ["reward-providers", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/rewards/providers?projectId=${projectId}`);
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  const provider = providers?.[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Reward links</h3>
          <p className="text-xs text-muted-foreground">Configure ad-gated reward flows with checkpoints.</p>
        </div>
        {provider && (
          <Button size="sm" variant="outline" onClick={() => window.open(`#/ads/get-key/${provider.projectId}`, "_blank")}>
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Preview public flow
          </Button>
        )}
      </div>

      {!provider ? (
        <Card className="glass-panel">
          <EmptyState
            icon={Gift}
            title="No reward provider configured"
            description="Add a provider to start generating reward links. The Mock provider is recommended for development."
            action={
              <Button size="sm" onClick={async () => {
                const r = await fetch("/api/rewards/providers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ projectId, name: "Mock Reward Provider", type: "mock" }),
                });
                if (r.ok) {
                  toast.success("Provider created");
                  qc.invalidateQueries({ queryKey: ["reward-providers", projectId] });
                }
              }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Mock provider
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="glass-panel p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/10 grid place-items-center">
              <Gift className="w-4 h-4 text-rose-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{provider.name}</h4>
                <Badge variant="outline" className="text-[10px] uppercase">{provider.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Reward: {provider.rewardAmount} key · Cooldown: {provider.cooldownSec}s</p>
            </div>
            <Switch defaultChecked={provider.enabled} />
          </Card>

          <CheckpointsList projectId={projectId} providerId={provider.id} />
        </>
      )}
    </div>
  );
}

function CheckpointsList({ projectId, providerId }: { projectId: string; providerId: string }) {
  const qc = useQueryClient();
  const { data: provider } = useQuery({
    queryKey: ["reward-providers", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/rewards/providers?projectId=${projectId}`);
      const j = await r.json();
      return j?.data?.[0];
    },
  });

  const checkpoints = provider?.checkpoints ?? [];

  return (
    <Card className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Checkpoints</h4>
        <Button size="sm" variant="outline" onClick={async () => {
          const r = await fetch("/api/rewards/checkpoints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              name: `Checkpoint ${checkpoints.length + 1}`,
              order: checkpoints.length,
            }),
          });
          if (r.ok) {
            toast.success("Checkpoint added");
            qc.invalidateQueries({ queryKey: ["reward-providers", projectId] });
          }
        }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add checkpoint
        </Button>
      </div>
      {checkpoints.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No checkpoints yet. Add at least one to enable the reward flow.</p>
      ) : (
        <div className="space-y-2">
          {checkpoints.map((c: any, i: number) => (
            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/20">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 grid place-items-center text-[10px] font-mono font-semibold text-violet-300">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">Reward: {c.rewardValue} · Cooldown: {c.cooldownSec}s</div>
              </div>
              <Switch defaultChecked={c.enabled} />
              <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-300" onClick={async () => {
                await fetch(`/api/rewards/checkpoints?id=${c.id}`, { method: "DELETE" });
                toast.success("Checkpoint deleted");
                qc.invalidateQueries({ queryKey: ["reward-providers", projectId] });
              }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline analytics
// ────────────────────────────────────────────────────────────────────────────
export function InlineAnalytics({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", projectId, "30d"],
    queryFn: async () => {
      const r = await fetch(`/api/analytics?projectId=${projectId}&range=30d`);
      const j = await r.json();
      return j?.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Total requests", v: data?.totals.totalRequests ?? 0 },
          { l: "Successful", v: data?.totals.successfulRequests ?? 0 },
          { l: "Failed", v: data?.totals.failedRequests ?? 0 },
          { l: "Active users", v: data?.totals.activeUsers ?? 0 },
          { l: "Keys created", v: data?.totals.keysCreated ?? 0 },
          { l: "Keys redeemed", v: data?.totals.keysRedeemed ?? 0 },
          { l: "Rewards completed", v: data?.totals.rewardsCompleted ?? 0 },
          { l: "Conversion rate", v: `${data?.totals.rewardConversionRate ?? 0}%` },
        ].map((s) => (
          <Card key={s.l} className="glass-panel p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="text-xl font-semibold tabular-nums mt-0.5">
              {isLoading ? <span className="inline-block w-12 h-5 shimmer rounded" /> : s.v}
            </div>
          </Card>
        ))}
      </div>
      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Activity · last 30 days</h3>
        <p className="text-xs text-muted-foreground mb-4">Requests vs sessions vs keys vs rewards</p>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full w-full shimmer rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 265 / 0.95)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="requests" fill="oklch(0.7 0.19 285)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sessions" fill="oklch(0.7 0.16 200)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline project settings
// ────────────────────────────────────────────────────────────────────────────
export function InlineProjectSettings({ projectId, project }: { projectId: string; project: any }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState(project.visibility);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const r = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, visibility, status }),
    });
    setSaving(false);
    if (r.ok) toast.success("Project updated");
    else toast.error("Failed to update");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="glass-panel p-5 space-y-4">
        <h3 className="font-semibold text-sm">General</h3>
        <div className="space-y-2">
          <Label>Project name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/40" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/40 resize-none" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Public reward link</h3>
        <p className="text-xs text-muted-foreground mb-3">Share this link to give users a checkpoint-gated path to a free key.</p>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={`${window.location.origin}/#/ads/get-key/${project.identifier}`}
            className="bg-muted/40 font-mono text-xs"
          />
          <Button variant="outline" size="icon" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/#/ads/get-key/${project.identifier}`);
            toast.success("Reward link copied");
          }}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      <Card className="glass-panel p-5 border-rose-500/30">
        <h3 className="font-semibold text-sm mb-1 text-rose-300">Danger zone</h3>
        <p className="text-xs text-muted-foreground mb-3">Archive this project. All keys will be revoked, sessions terminated.</p>
        <Button variant="outline" className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10" onClick={async () => {
          if (!confirm("Archive this project? This cannot be undone.")) return;
          await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
          toast.success("Project archived");
          navigate("/projects");
        }}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Archive project
        </Button>
      </Card>
    </div>
  );
}
