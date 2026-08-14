import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { db } from "./db";
import type { Role } from "./authz";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

/**
 * Returns the current authenticated user by verifying the Supabase access
 * token from the Authorization header. If the Supabase user exists but has
 * no local Profile record yet, one is created lazily with role "creator".
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const h = headers();
  const authHeader = h.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  // Verify the token with Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user || !user.email) return null;

  // Find or create the local profile
  let profile = await db.profile.findFirst({
    where: { email: user.email },
  });

  if (!profile) {
    const username =
      (user.user_metadata?.username as string) ??
      user.email.split("@")[0];

    // Ensure username uniqueness
    let uniqueUsername = username;
    let suffix = 1;
    while (await db.profile.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${username}_${suffix++}`;
    }

    profile = await db.profile.create({
      data: {
        email: user.email,
        username: uniqueUsername,
        displayName: user.user_metadata?.username ?? null,
        role: "creator",
      },
    });
  }

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role as Role,
  };
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.profile.findUnique({ where: { id: user.id } });
}
