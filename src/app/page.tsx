"use client";

import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/shared/app-shell";
import { useRouter, matchPath } from "@/lib/router";
import { LandingView } from "@/components/views/landing";
import { AuthView } from "@/components/views/auth";
import { DashboardView } from "@/components/views/dashboard";
import { ProjectsView } from "@/components/views/projects";
import { KeysView } from "@/components/views/keys";
import { UsersView } from "@/components/views/users";
import { SessionsView } from "@/components/views/sessions";
import { RewardsView } from "@/components/views/rewards";
import { AnalyticsView } from "@/components/views/analytics";
import { ApiKeysView } from "@/components/views/api-keys";
import { DiscordView } from "@/components/views/discord";
import { AdminView } from "@/components/views/admin";
import { SettingsView } from "@/components/views/settings";
import { DocsView } from "@/components/views/docs";
import { AdsView } from "@/components/views/ads";

export default function Home() {
  return (
    <AppProviders>
      <AppShell>
        <Router />
      </AppShell>
    </AppProviders>
  );
}

function Router() {
  const router = useRouter();

  // Default to landing when at root
  const path = router.path === "/" ? "/landing" : router.path;

  // Auth routes — bare (no shell)
  if (path.startsWith("/auth/signin")) return <AuthView mode="signin" />;
  if (path.startsWith("/auth/signup")) return <AuthView mode="signup" />;
  if (path.startsWith("/auth/reset")) return <AuthView mode="reset" />;

  // Public routes — bare (no shell)
  if (path === "/landing") return <LandingView />;
  if (path.startsWith("/ads")) return <AdsView />;

  // Dashboard routes (wrapped in shell)
  if (path === "/dashboard") return <DashboardView />;
  if (path.startsWith("/projects")) return <ProjectsView />;
  if (path.startsWith("/scripts")) return <ProjectsView />; // scripts top-level reuses project-aware view
  if (path.startsWith("/keys")) return <KeysView />;
  if (path.startsWith("/users")) return <UsersView />;
  if (path.startsWith("/sessions")) return <SessionsView />;
  if (path.startsWith("/rewards")) return <RewardsView />;
  if (path.startsWith("/analytics")) return <AnalyticsView />;
  if (path.startsWith("/api-keys")) return <ApiKeysView />;
  if (path.startsWith("/discord")) return <DiscordView />;
  if (path.startsWith("/admin")) return <AdminView />;
  if (path.startsWith("/settings")) return <SettingsView />;
  if (path.startsWith("/docs")) return <DocsView />;

  // Fallback
  return <LandingView />;
}
