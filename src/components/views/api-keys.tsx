"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Code2, Plus, Copy, Check, RotateCcw, Trash2, AlertTriangle, Key } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_PERMISSIONS = [
  { key: "projects:read", label: "Projects · Read", desc: "List and view project details" },
  { key: "projects:write", label: "Projects · Write", desc: "Create and update projects" },
  { key: "scripts:read", label: "Scripts · Read", desc: "List scripts and versions" },
  { key: "scripts:write", label: "Scripts · Write", desc: "Create and publish scripts" },
  { key: "users:read", label: "Users · Read", desc: "List end users" },
  { key: "users:write", label: "Users · Write", desc: "Ban, suspend, reset HWID" },
  { key: "keys:read", label: "Keys · Read", desc: "List and search keys" },
  { key: "keys:write", label: "Keys · Write", desc: "Generate, revoke, extend" },
  { key: "analytics:read", label: "Analytics · Read", desc: "View analytics data" },
];

export function ApiKeysView() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const r = await fetch("/api/api-keys");
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  const revoke = async (id: string) => {
    if (!confirm("Revoke this API key? Any service using it will lose access immediately.")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    toast.success("API key revoked");
    qc.invalidateQueries({ queryKey: ["api-keys"] });
  };

  const rotate = async (id: string) => {
    if (!confirm("Rotate this key? The old one will be revoked and a new one issued.")) return;
    const r = await fetch(`/api/api-keys/${id}/rotate`, { method: "POST" });
    const j = await r.json();
    if (j?.success) {
      setRawKey(j.data.rawKey);
      toast.success("Key rotated — copy the new one now");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Programmatic access to your VaultLua account. Permissions are granular and per-resource."
        actions={
          <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create key
          </Button>
        }
      />

      <Card className="glass-panel mb-4 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 grid place-items-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-sm">
          <p className="font-medium mb-0.5">Treat API keys like passwords</p>
          <p className="text-xs text-muted-foreground">
            Keys are shown <strong className="text-foreground">once</strong> on creation. Store them in a secret manager. Rotate immediately if leaked.
          </p>
        </div>
      </Card>

      {isLoading ? (
        <Card className="glass-panel p-4 h-32"><div className="h-full w-full shimmer rounded" /></Card>
      ) : !keys || keys.length === 0 ? (
        <Card className="glass-panel">
          <EmptyState
            icon={Code2}
            title="No API keys yet"
            description="Create an API key to start integrating VaultLua with your CI, bot, or executor."
            action={<Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={() => setCreateOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Create key</Button>}
          />
        </Card>
      ) : (
        <Card className="glass-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Key</TableHead>
                <TableHead className="text-xs">Permissions</TableHead>
                <TableHead className="text-xs">Last used</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k: any) => (
                <TableRow key={k.id} className="border-border/40 hover:bg-muted/30">
                  <TableCell>
                    <div className="text-sm font-medium">{k.name}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{k.keyPrefix}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {JSON.parse(k.permissions).map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[9px] font-mono bg-violet-500/10 text-violet-300 border-violet-500/20">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.lastUsedAt ? `${new Date(k.lastUsedAt).toLocaleString()} · ${k.lastUsedIp}` : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => rotate(k.id)}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-300" onClick={() => revoke(k.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(raw) => setRawKey(raw)} />
      <RawKeyDialog rawKey={rawKey} onClose={() => setRawKey(null)} />
    </div>
  );
}

function CreateApiKeyDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (raw: string) => void }) {
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>(["projects:read", "scripts:read", "keys:read", "analytics:read"]);
  const [creating, setCreating] = useState(false);

  const toggle = (p: string) => setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const create = async () => {
    if (!name) return toast.error("Name required");
    setCreating(true);
    try {
      const r = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions: perms }),
      });
      const j = await r.json();
      if (j?.success) {
        onCreated(j.data.rawKey);
        toast.success("API key created");
        setName("");
        onOpenChange(false);
      } else {
        toast.error(j?.error?.message ?? "Failed");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong max-w-lg">
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>Choose a name and the permissions this key will have.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Key name</Label>
            <Input placeholder="e.g. Production CI" value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/40" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto p-1">
              {ALL_PERMISSIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => toggle(p.key)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border text-left transition-colors",
                    perms.includes(p.key)
                      ? "bg-violet-500/10 border-violet-500/40"
                      : "bg-muted/20 border-border/60 hover:bg-muted/40"
                  )}
                >
                  <Switch checked={perms.includes(p.key)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" disabled={creating} onClick={create}>
            {creating ? "Creating…" : "Create key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RawKeyDialog({ rawKey, onClose }: { rawKey: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success("API key copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={!!rawKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-panel-strong max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-300" />
            Save your API key
          </DialogTitle>
          <DialogDescription>
            This is the only time the full key will be shown. Store it securely.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 font-mono text-xs break-all">
            {rawKey}
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-200">
              Closing this dialog hides the key forever. You can rotate it later, but you'll never see this exact value again.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied" : "Copy key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
