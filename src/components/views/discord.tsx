"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, Bot, Link2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ProjectAwareView } from "@/components/shared/project-aware";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/primitives";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DiscordView() {
  return (
    <ProjectAwareView
      title="Discord Integration"
      description="Auto-assign roles on key redemption, remove on revocation, sync bans. Bot token is stored server-side only."
      emptyIcon={MessageSquare}
      emptyTitle="No project selected"
      emptyDescription="Create a project first, then select it to configure Discord integration."
      render={(projectId) => <DiscordConfig projectId={projectId} />}
    />
  );
}

function DiscordConfig({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: integration, isLoading } = useQuery({
    queryKey: ["discord", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/discord?projectId=${projectId}`);
      const j = await r.json();
      return j?.data;
    },
  });

  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [roleMappings, setRoleMappings] = useState<any[]>([]);
  const [notifyOnRedeem, setNotifyOnRedeem] = useState(true);
  const [notifyOnRevoke, setNotifyOnRevoke] = useState(true);
  const [notifyOnBan, setNotifyOnBan] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (integration) {
      setGuildId(integration.guildId ?? "");
      setGuildName(integration.guildName ?? "");
      setWebhookUrl(integration.webhookUrl ?? "");
      setRoleMappings(integration.roleMappings ?? []);
      setNotifyOnRedeem(integration.notifyOnRedeem);
      setNotifyOnRevoke(integration.notifyOnRevoke);
      setNotifyOnBan(integration.notifyOnBan);
    }
  }, [integration]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          guildId,
          guildName,
          webhookUrl,
          roleMappings,
          notifyOnRedeem,
          notifyOnRevoke,
          notifyOnBan,
        }),
      });
      if (r.ok) {
        toast.success("Discord settings saved");
        qc.invalidateQueries({ queryKey: ["discord", projectId] });
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const connect = async () => {
    // Mock connection flow — in production this would OAuth to Discord
    toast.info("Initiating Discord OAuth…", {
      description: "Bot connection is a mock in this demo. In production, this would redirect to Discord's OAuth flow.",
    });
    setTimeout(() => {
      setGuildName("VaultLua Community");
      setGuildId("1234567890123456789");
      toast.success("Bot connected (mock)", {
        description: "Configure your role mappings below, then save.",
      });
    }, 800);
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Discord bot?")) return;
    await fetch(`/api/discord?projectId=${projectId}`, { method: "DELETE" });
    toast.success("Discord disconnected");
    qc.invalidateQueries({ queryKey: ["discord", projectId] });
  };

  if (isLoading) {
    return <Card className="glass-panel p-4 h-64"><div className="h-full w-full shimmer rounded" /></Card>;
  }

  const connected = integration?.status === "connected";

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="glass-panel p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl grid place-items-center",
              connected ? "bg-[#5865F2]/15" : "bg-muted/40"
            )}>
              <Bot className={cn("w-6 h-6", connected ? "text-[#5865F2]" : "text-muted-foreground")} />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {connected ? "VaultLua Bot" : "No bot connected"}
                <StatusBadge status={connected ? "connected" : "pending"} />
              </h3>
              <p className="text-xs text-muted-foreground">
                {connected ? `Connected to ${integration?.guildName ?? "your server"}` : "Connect your Discord bot to enable role automation"}
              </p>
            </div>
          </div>
          {connected ? (
            <Button variant="outline" size="sm" className="text-rose-300" onClick={disconnect}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={connect}>
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              Connect bot
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Guild ID</Label>
            <Input placeholder="1234567890123456789" value={guildId} onChange={(e) => setGuildId(e.target.value)} className="bg-muted/40 font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Guild name</Label>
            <Input placeholder="Your Server Name" value={guildName} onChange={(e) => setGuildName(e.target.value)} className="bg-muted/40" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label>Webhook URL (optional)</Label>
          <Input placeholder="https://discord.com/api/webhooks/…" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="bg-muted/40 font-mono text-xs" />
          <p className="text-[10px] text-muted-foreground">Used to post session alerts, reward completions, and abuse warnings.</p>
        </div>
      </Card>

      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Role mappings</h3>
        <p className="text-xs text-muted-foreground mb-4">Automatically assign or remove Discord roles based on license status.</p>

        <div className="space-y-2">
          {roleMappings.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No role mappings yet. Add one to start automating.
            </div>
          ) : (
            roleMappings.map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <Badge variant="outline" className="capitalize">{m.licenseStatus}</Badge>
                <span className="text-xs text-muted-foreground">→</span>
                <Input value={m.roleName} onChange={(e) => {
                  const next = [...roleMappings];
                  next[i] = { ...m, roleName: e.target.value };
                  setRoleMappings(next);
                }} className="bg-muted/40 text-xs flex-1 h-7" />
                <Input value={m.roleId} onChange={(e) => {
                  const next = [...roleMappings];
                  next[i] = { ...m, roleId: e.target.value };
                  setRoleMappings(next);
                }} className="bg-muted/40 text-xs font-mono h-7 w-40" placeholder="role ID" />
                <Button size="sm" variant="ghost" className="h-7 text-rose-300" onClick={() => setRoleMappings(roleMappings.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
          <Button size="sm" variant="outline" onClick={() => setRoleMappings([...roleMappings, { licenseStatus: "active", roleId: "", roleName: "Verified" }])}>
            <Plus className="w-3 h-3 mr-1.5" />
            Add mapping
          </Button>
        </div>
      </Card>

      <Card className="glass-panel p-5">
        <h3 className="font-semibold text-sm mb-1">Notifications</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose which events trigger a Discord notification.</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <div>
              <div className="text-sm font-medium">Key redeemed</div>
              <div className="text-xs text-muted-foreground">When a user claims a license key, assign role + post message</div>
            </div>
            <Switch checked={notifyOnRedeem} onCheckedChange={setNotifyOnRedeem} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <div>
              <div className="text-sm font-medium">Key revoked</div>
              <div className="text-xs text-muted-foreground">When a key is revoked or expires, remove role + post message</div>
            </div>
            <Switch checked={notifyOnRevoke} onCheckedChange={setNotifyOnRevoke} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <div>
              <div className="text-sm font-medium">User banned</div>
              <div className="text-xs text-muted-foreground">When a user is banned, optionally remove all roles</div>
            </div>
            <Switch checked={notifyOnBan} onCheckedChange={setNotifyOnBan} />
          </div>
        </div>
      </Card>

      <Card className="glass-panel p-5 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-amber-200 mb-1">Mock integration</p>
            <p className="text-amber-200/80">
              The Discord bot itself is not deployed in this demo. The full UI and backend interface are implemented, and would call Discord's API in production. Bot tokens are never exposed to the browser.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
