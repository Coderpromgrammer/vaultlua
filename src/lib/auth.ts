import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { hashPassword, verifyPassword, type Role } from "./authz";

const DEMO_USERS = [
  {
    id: "owner_demo",
    email: "owner@vaultlua.dev",
    username: "vaultowner",
    displayName: "Vault Owner",
    role: "owner" as Role,
    password: "vaultlua-demo",
  },
  {
    id: "admin_demo",
    email: "admin@vaultlua.dev",
    username: "vaultadmin",
    displayName: "Vault Admin",
    role: "admin" as Role,
    password: "vaultlua-demo",
  },
  {
    id: "creator_demo",
    email: "creator@vaultlua.dev",
    username: "creator_dan",
    displayName: "Dan — Creator",
    role: "creator" as Role,
    password: "vaultlua-demo",
  },
  {
    id: "creator2_demo",
    email: "creator2@vaultlua.dev",
    username: "creator_maya",
    displayName: "Maya — Creator",
    role: "creator" as Role,
    password: "vaultlua-demo",
  },
];

async function ensureDemoProfiles() {
  for (const u of DEMO_USERS) {
    const existing = await db.profile.findUnique({ where: { email: u.email } });
    if (!existing) {
      await db.profile.create({
        data: {
          id: u.id,
          email: u.email,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          passwordHash: await hashPassword(u.password),
        },
      });
    }
  }
}

export const authOptions: NextAuthOptions = {
  // Explicit, no DB adapter — we manage profiles in our own tables.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/#/auth/signin",
    error: "/#/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "VaultLua",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await ensureDemoProfiles();
        const profile = await db.profile.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!profile?.passwordHash) return null;
        const ok = await verifyPassword(credentials.password, profile.passwordHash);
        if (!ok) return null;
        await db.profile.update({
          where: { id: profile.id },
          data: { lastSeenAt: new Date() },
        });
        return {
          id: profile.id,
          email: profile.email,
          name: profile.displayName ?? profile.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const profile = await db.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        });
        if (profile) {
          token.uid = profile.id;
          token.role = profile.role as Role;
          token.username = profile.username;
          token.displayName = profile.displayName;
          token.avatarUrl = profile.avatarUrl;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "vaultlua-dev-secret-change-in-production",
};
