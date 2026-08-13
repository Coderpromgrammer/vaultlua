import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";
import { getClientIp as getClientIpImpl, type Role } from "./authz";

// Re-export so existing imports from "@/lib/session" keep working
export const getClientIp = getClientIpImpl;

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.displayName,
    avatarUrl: session.user.avatarUrl,
    role: session.user.role,
  };
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.profile.findUnique({ where: { id: user.id } });
}
