"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { AuthProvider } from "@/lib/auth-context";

/**
 * Inner component that runs inside ClerkProvider so it can use `useAuth()`
 * to attach the Clerk session JWT to every same-origin API request.
 */
function FetchInterceptor({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const headers = new Headers(init?.headers ?? {});

      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : input.url;
      const isApiCall =
        url.startsWith("/api/") ||
        url.startsWith(`${window.location.origin}/api/`);

      if (isSignedIn && isApiCall && !headers.has("Authorization")) {
        const token = await getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}

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

  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <QueryClientProvider client={queryClient}>
        <FetchInterceptor>
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
        </FetchInterceptor>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
