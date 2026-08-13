"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Shield, Bell, Palette, CreditCard, Key, Save, Copy } from "lucide-react";
import { PageHeader } from "@/components/shared/primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/me");
      const j = await r.json();
      return j?.data;
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useState(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setUsername(profile.username ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  });

  const save = async () => {
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, avatarUrl }),
    });
    if (r.ok) {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, security, notifications, and appearance."
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-muted/30 border border-border/60 h-9 p-1">
          <TabsTrigger value="profile" className="text-xs"><User className="w-3.5 h-3.5 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-xs"><Shield className="w-3.5 h-3.5 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs"><Bell className="w-3.5 h-3.5 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs"><Palette className="w-3.5 h-3.5 mr-1.5" />Appearance</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="glass-panel p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-lg">
                  {username?.slice(0, 2).toUpperCase() ?? "VL"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{displayName || username}</h3>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                <Badge variant="outline" className="mt-1 capitalize bg-violet-500/10 text-violet-300 border-violet-500/30">
                  {(session?.user as any)?.role}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-muted/40 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Avatar URL (optional)</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="bg-muted/40" placeholder="https://…" />
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0" onClick={save}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save profile
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass-panel p-6 max-w-2xl space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-300" />
              Security
            </h3>
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" placeholder="••••••••" className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" placeholder="At least 12 characters" className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" placeholder="Repeat password" className="bg-muted/40" />
            </div>
            <Button variant="outline" onClick={() => toast.info("Password change is disabled in demo")}>
              Update password
            </Button>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div>
                  <div className="text-sm font-medium">Two-factor authentication</div>
                  <div className="text-xs text-muted-foreground">Require a TOTP code at sign in</div>
                </div>
                <Switch onCheckedChange={() => toast.info("2FA setup is disabled in demo")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div>
                  <div className="text-sm font-medium">Active sessions</div>
                  <div className="text-xs text-muted-foreground">Manage devices signed into your account</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("1 active session (this one)")}>View</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-panel p-6 max-w-2xl space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-300" />
              Email notifications
            </h3>
            {[
              { l: "Script published", d: "When a new version of your script is published" },
              { l: "Suspicious activity", d: "HWID resets, repeated failures, fraud flags" },
              { l: "Reward provider errors", d: "When a provider returns errors or timeouts" },
              { l: "API rate limit warnings", d: "When your API key is at 80%+ of quota" },
              { l: "Key expiration wave", d: "Weekly summary of soon-to-expire keys" },
              { l: "Discord integration errors", d: "When the bot loses connection or fails" },
            ].map((n, i) => (
              <div key={n.l} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div>
                  <div className="text-sm font-medium">{n.l}</div>
                  <div className="text-xs text-muted-foreground">{n.d}</div>
                </div>
                <Switch defaultChecked={i < 4} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="glass-panel p-6 max-w-2xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-300" />
              Appearance
            </h3>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <button className="p-3 rounded-lg border border-violet-500/40 bg-violet-500/10 text-left">
                  <div className="text-xs font-medium mb-0.5">Dark (default)</div>
                  <div className="text-[10px] text-muted-foreground">VaultLua signature</div>
                </button>
                <button className="p-3 rounded-lg border border-border/60 bg-muted/30 text-left opacity-50" disabled>
                  <div className="text-xs font-medium mb-0.5">Light</div>
                  <div className="text-[10px] text-muted-foreground">Coming soon</div>
                </button>
                <button className="p-3 rounded-lg border border-border/60 bg-muted/30 text-left opacity-50" disabled>
                  <div className="text-xs font-medium mb-0.5">System</div>
                  <div className="text-[10px] text-muted-foreground">Match OS</div>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="flex gap-2">
                {["oklch(0.7 0.19 285)", "oklch(0.7 0.16 200)", "oklch(0.7 0.16 155)", "oklch(0.78 0.17 75)", "oklch(0.65 0.22 330)"].map((c, i) => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background",
                      i === 0 ? "ring-foreground" : "ring-transparent"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="glass-panel p-6 max-w-2xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-300" />
              Billing
            </h3>
            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/5 border border-violet-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Current plan</div>
                  <div className="text-xl font-semibold">Pro</div>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Active</Badge>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><div className="text-muted-foreground">Projects</div><div className="font-semibold">25</div></div>
                <div><div className="text-muted-foreground">Keys</div><div className="font-semibold">10,000</div></div>
                <div><div className="text-muted-foreground">Renews</div><div className="font-semibold">Sep 14, 2026</div></div>
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info("Billing portal not available in demo")}>
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Manage subscription
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
