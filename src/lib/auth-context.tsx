"use client";

import {
  useUser as useClerkUser,
  useClerk,
} from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Clerk-backed auth context adapter.
 *
 * Existing VaultLua components consume `useAuth()` for `{ user, loading, signOut }`.
 * We expose the same shape backed by Clerk so they work without rewrites.
 * Sign-in / sign-up are handled by Clerk's <SignIn /> / <SignUp /> components
 * on the /auth routes — the legacy `signIn(email, password)` /
 * `signUp(email, password, username)` methods are no-ops that redirect to the
 * Clerk-hosted auth pages.
 */

interface AuthAdapterUser {
  id: string;
  email: string | null;
  username: string | null;
  imageUrl?: string | null;
}

interface AuthContextValue {
  user: AuthAdapterUser | null;
  loading: boolean;
  signIn: (email?: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (
    email?: string,
    password?: string,
    username?: string
  ) => Promise<{ error: string | null; needsVerification: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email?: string) => Promise<{ error: string | null }>;
}

// Use a simple context so consumers can call useAuth() without a provider
// hierarchy change — ClerkProvider is set up in providers.tsx and gives us
// access to useUser / useClerk anywhere inside the tree.
import { createContext, useContext } from "react";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useClerkUser();
  const { signOut: clerkSignOut, redirectToSignIn } = useClerk();

  const adapterUser: AuthAdapterUser | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        username: user.username ?? (user.firstName ?? null),
        imageUrl: user.imageUrl,
      }
    : null;

  const signIn = async () => {
    redirectToSignIn();
    return { error: null };
  };

  const signUp = async () => {
    redirectToSignIn(); // Clerk's combined flow handles sign-up too
    return { error: null, needsVerification: false };
  };

  const signOut = async () => {
    await clerkSignOut();
  };

  const resetPassword = async () => {
    redirectToSignIn();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user: adapterUser,
        loading: !isLoaded,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
