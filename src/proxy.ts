import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clerk proxy (Next.js 16+ successor to middleware.ts).
 *
 * VaultLua uses a hash-router for the dashboard UI (everything renders on `/`),
 * and authentication is enforced at the API route level via `getCurrentUser()`
 * in src/lib/session.ts. We don't use middleware-level route protection —
 * every protected API route calls getCurrentUser() and returns 401 if not
 * signed in.
 *
 * IMPORTANT — gateway hostname fix:
 * The space-z.ai gateway forwards requests to Function Compute with the
 * internal fcapp.run hostname in the `Host` header. Without rewriting, Clerk
 * builds its handshake redirect URL from that internal hostname, which means
 * cookies get set on `fcapp.run` instead of on our public domain — causing
 * the redirect loop to
 * `ytvafc-d-deploy-htkqrzcljy.cn-hongkong-vpc.fcapp.run/?__clerk_handshake=...`.
 *
 * Fix: we run the underlying clerkMiddleware, then post-process its response.
 * If Clerk returned a handshake redirect to the internal fcapp URL, we rewrite
 * the Location header back to the public domain. We also strip Domain=
 * attributes from Set-Cookie headers so cookies are scoped to the public host
 * (host-only), not the internal fcapp.run domain.
 */

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

const clerk = clerkMiddleware();

export default async function proxy(req: NextRequest) {
  const res = await clerk(req as never);

  if (!PUBLIC_DOMAIN) return res;

  // Rewrite Location header: replace any internal fcapp.run URL with the public domain
  const location = res.headers.get("location");
  if (location && (location.includes("fcapp.run") || location.includes("cn-hongkong"))) {
    try {
      const publicUrl = new URL(PUBLIC_DOMAIN);
      const locUrl = new URL(location);
      locUrl.protocol = publicUrl.protocol;
      locUrl.host = publicUrl.host;
      locUrl.port = "";
      res.headers.set("location", locUrl.toString());
    } catch {
      // ignore parse errors
    }
  }

  // Strip Domain= attributes from Set-Cookie headers so cookies are host-only
  // on the public domain the browser is using, not on the internal fcapp.run
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    const rewritten = setCookies.map((c) =>
      c.replace(/Domain=[^;]+;?\s*/gi, "")
    );
    res.headers.delete("set-cookie");
    for (const c of rewritten) {
      res.headers.append("set-cookie", c);
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (unless they start with "next")
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes so auth() can read the session
    "/(api|trpc)(.*)",
    // Clerk proxy path — required for Clerk's internal auth handshake
    "/__clerk/:path*",
  ],
};
