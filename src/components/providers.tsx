"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { supabase, getAccessToken } from "@/lib/supabase-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Global fetch interceptor: automatically attaches the Supabase access
  // token to every API request so the server can authenticate the user.
  // This runs once on mount and patches window.fetch for the lifetime of
  // the session.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const token = getAccessToken();
      const headers = new Headers(init?.headers ?? {});

      // Only add auth header for same-origin API calls that don't already have one
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : input.url;
      const isApiCall =
        url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);

      if (token && isApiCall && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.18 0.02 265 / 0.95)",
              border: "1px solid oklch(1 0 0 / 0.1)",
              color: "oklch(0.96 0.005 260)",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
