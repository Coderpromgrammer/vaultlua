"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "vaultlua-auth",
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Module-level access token cache — updated synchronously by the auth listener.
// This lets the fetch interceptor add the Authorization header without an
// async round-trip on every request.
// ────────────────────────────────────────────────────────────────────────────
let currentAccessToken: string | null = null;

// Initialise from any existing session (runs once on module load)
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentAccessToken = session?.access_token ?? null;
  });
}

supabase.auth.onAuthStateChange((_event, session) => {
  currentAccessToken = session?.access_token ?? null;
});

export function getAccessToken(): string | null {
  return currentAccessToken;
}
