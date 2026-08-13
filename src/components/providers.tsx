"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

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

  // Auto-seed demo data on first mount
  useEffect(() => {
    fetch("/api/seed")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.seeded) {
          fetch("/api/seed", { method: "POST" }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
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
      </SessionProvider>
    </QueryClientProvider>
  );
}
