import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { Role } from "./authz";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
  clerkId: string;
};

/**
 * Returns the current authenticated user via Clerk. If the Clerk user exists
 * but has no local Profile record yet, one is created lazily with role
 * "creator". The Clerk user ID is stored on the Profile as `clerkId` (added
 * via nullable column on the schema via Prisma — falls back to a metadata
 * lookup when not present).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    clerkUser.primaryEmailAddress?.emailAddress ??
    null;
  if (!email) return null;

  const username =
    (clerkUser.username as string | undefined) ??
    (clerkUser.publicMetadata?.username as string | undefined) ??
    (clerkUser.firstName ?? "").toLowerCase() ??
    email.split("@")[0];

  // Find existing profile by Clerk ID first, then by email (legacy migration)
  let profile = await db.profile.findFirst({
    where: {
      OR: [{ id: session.userId }, { email }],
    },
  });

  if (!profile) {
    // Ensure username uniqueness
    let uniqueUsername = username;
    let suffix = 1;
    while (await db.profile.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${username}_${suffix++}`;
    }

    profile = await db.profile.create({
      data: {
        // Use Clerk userId as the Profile id so API routes can pass it directly
        // to where: { ownerId: user.id } without an extra lookup.
        id: session.userId,
        email,
        username: uniqueUsername,
        displayName: clerkUser.username ?? clerkUser.firstName ?? null,
        avatarUrl: clerkUser.imageUrl ?? null,
        role: "creator",
      },
    });
  } else if (profile.email !== email || profile.avatarUrl !== clerkUser.imageUrl) {
    // Keep email and avatar in sync with Clerk
    profile = await db.profile.update({
      where: { id: profile.id },
      data: {
        email,
        avatarUrl: clerkUser.imageUrl ?? null,
      },
    });
  }

  // Touch lastSeenAt
  await db.profile
    .update({
      where: { id: profile.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role as Role,
    clerkId: session.userId,
  };
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.profile.findUnique({ where: { id: user.id } });
}
