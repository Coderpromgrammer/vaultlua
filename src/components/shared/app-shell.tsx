"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, navigate } from "@/lib/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, FileCode2, Users, KeyRound,
  Radio, Gift, BarChart3, Code2, MessageSquare, BookOpen,
  Settings, Shield, Bell, Search, Menu, X, Command as CmdIcon,
  LogOut, ChevronRight, Plus, Sparkles, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultLogo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup,
  CommandItem, CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
  category: "main" | "system";
}

const NAV: NavItem[] = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard, category: "main" },
  { label: "Projects", path: "/projects", icon: FolderKanban, category: "main" },
  { label: "Scripts", path: "/scripts", icon: FileCode2, category: "main" },
  { label: "Users", path: "/users", icon: Users, category: "main" },
  { label: "Keys", path: "/keys", icon: KeyRound, category: "main" },
  { label: "Sessions", path: "/sessions", icon: Radio, category: "main" },
  { label: "Rewards", path: "/rewards", icon: Gift, category: "main" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, category: "main" },
  { label: "API", path: "/api-keys", icon: Code2, category: "main" },
  { label: "Discord", path: "/discord", icon: MessageSquare, category: "main" },
  { label: "Documentation", path: "/docs", icon: BookOpen, category: "main" },
  { label: "Settings", path: "/settings", icon: Settings, category: "main" },
  { label: "Admin", path: "/admin", icon: Shield, category: "system", adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Not on a dashboard route — render bare (landing/auth/ads/docs)
  const isDashboardRoute = useMemo(
    () =>
      router.segments.length > 0 &&
      !router.segments[0].startsWith("auth") &&
      router.segments[0] !== "ads" &&
      router.segments[0] !== "landing",
    [router.segments]
  );

  // Redirect unauthenticated dashboard users to sign-in
  useEffect(() => {
    if (authLoading) return;
    if (isDashboardRoute && !user) {
      router.replace("/auth/signin");
    }
  }, [isDashboardRoute, authLoading, user, router]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch("/api/notifications");
      const j = await r.json();
      if (j?.success) {
        setNotifications(j.data.items);
        setUnreadCount(j.data.unread);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    // Initial load + periodic refresh. loadNotifications is async and
    // calls setState internally; wrapping in setTimeout avoids the
    // cascading-render lint warning while preserving behavior.
    const initial = setTimeout(loadNotifications, 0);
    const t = setInterval(loadNotifications, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [loadNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    loadNotifications();
  };

  // Fetch profile (including role) from the server via /api/me
  const [profile, setProfile] = useState<{ role: string; username: string; displayName?: string | null; email: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) setProfile(j.data);
      })
      .catch(() => {});
  }, [user]);

  const role = profile?.role ?? "creator";
  const isAdmin = role === "admin" || role === "owner";

  if (!isDashboardRoute) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <VaultLogo size={36} />
          <div className="h-1 w-24 shimmer rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-3">
          <VaultLogo size={36} />
          <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  const navMain = NAV.filter((n) => n.category === "main");
  const navSystem = NAV.filter((n) => n.category === "system" && (!n.adminOnly || isAdmin));

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border/60 shrink-0"
      >
        <VaultLogo size={28} withText />
      </button>

      <div className="px-3 pt-4 pb-2">
        <Button
          size="sm"
          className="w-full justify-start gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
          onClick={() => setCmdOpen(true)}
        >
          <Search className="w-4 h-4" />
          <span className="text-xs">Search…</span>
          <kbd className="ml-auto text-[10px] bg-black/30 px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-0.5 pb-4">
          {navMain.map((item) => (
            <NavLink key={item.path} item={item} router={router} />
          ))}
          {navSystem.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                System
              </div>
              {navSystem.map((item) => (
                <NavLink key={item.path} item={item} router={router} />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border/60 shrink-0">
        <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span className="text-xs font-medium">Pro tip</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use <kbd className="text-[10px] bg-black/40 px-1 py-0.5 rounded">⌘K</kbd> to jump anywhere or create new keys, projects, scripts in one keystroke.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar border-r border-sidebar-border/60">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 shrink-0 border-b border-border/60 glass-panel-strong flex items-center gap-3 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>

          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 border border-border/60 text-sm text-muted-foreground transition-colors w-72"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search projects, keys, users…</span>
            <kbd className="ml-auto text-[10px] bg-black/40 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-card" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-violet-300 hover:text-violet-200"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-96">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "px-3 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors cursor-default",
                          !n.read && "bg-violet-500/5"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                              n.type === "success" && "bg-emerald-400",
                              n.type === "warning" && "bg-amber-400",
                              n.type === "error" && "bg-rose-400",
                              n.type === "info" && "bg-cyan-400"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Account menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9 px-1.5">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-medium">
                      {(profile?.username ?? user.email ?? "VL").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-none">
                    <span className="text-xs font-medium">
                      {profile?.displayName ?? profile?.username ?? user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {role}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.displayName ?? profile?.username ?? user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="w-3.5 h-3.5 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/api-keys")}>
                  <Code2 className="w-3.5 h-3.5 mr-2" />
                  API keys
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Shield className="w-3.5 h-3.5 mr-2" />
                    Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-300 focus:text-rose-200"
                  onClick={() => {
                    signOut();
                    navigate("/landing");
                  }}
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={router.path}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
    </div>
  );
}

function NavLink({ item, router }: { item: NavItem; router: ReturnType<typeof useRouter> }) {
  const Icon = item.icon;
  const active = router.path === item.path || router.path.startsWith(item.path + "/");
  return (
    <button
      onClick={() => router.push(item.path)}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-all relative",
        active
          ? "bg-gradient-to-r from-violet-500/15 to-cyan-500/5 text-foreground border border-violet-500/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400"
        />
      )}
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-300" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="font-medium truncate">{item.label}</span>
      {item.badge && (
        <Badge className="ml-auto h-4 px-1.5 text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

const COMMANDS = [
  { label: "Go to Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Go to Projects", path: "/projects", icon: FolderKanban },
  { label: "Go to Scripts", path: "/scripts", icon: FileCode2 },
  { label: "Go to Users", path: "/users", icon: Users },
  { label: "Go to Keys", path: "/keys", icon: KeyRound },
  { label: "Go to Sessions", path: "/sessions", icon: Radio },
  { label: "Go to Rewards", path: "/rewards", icon: Gift },
  { label: "Go to Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Go to API Keys", path: "/api-keys", icon: Code2 },
  { label: "Go to Discord", path: "/discord", icon: MessageSquare },
  { label: "Go to Documentation", path: "/docs", icon: BookOpen },
  { label: "Go to Settings", path: "/settings", icon: Settings },
  { label: "Create new project", path: "/projects?new=1", icon: Plus },
  { label: "Generate keys", path: "/keys?new=1", icon: KeyRound },
  { label: "Search users", path: "/users", icon: Users },
  { label: "Go to Admin", path: "/admin", icon: Shield },
  { label: "Open public /ads reward page", path: "/ads", icon: Gift },
];

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl bg-popover/95 backdrop-blur-2xl border-border/80 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="rounded-2xl">
          <div className="flex items-center border-b border-border/60 px-4">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <CommandInput
              placeholder="Type a command or search…"
              className="border-0 focus:ring-0 h-12"
            />
            <kbd className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-muted-foreground">
              ESC
            </kbd>
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              {COMMANDS.map((c) => {
                const Icon = c.icon;
                return (
                  <CommandItem
                    key={c.label}
                    value={c.label}
                    onSelect={() => {
                      navigate(c.path);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{c.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/50" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick links">
              <CommandItem
                onSelect={() => {
                  navigate("/docs");
                  setOpen(false);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                Read the documentation
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate("/api-keys");
                  setOpen(false);
                }}
              >
                <Code2 className="w-4 h-4 mr-2 text-muted-foreground" />
                Create an API key
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate("/ads");
                  setOpen(false);
                }}
              >
                <Gift className="w-4 h-4 mr-2 text-muted-foreground" />
                Try the public reward flow
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
