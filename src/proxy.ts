import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk proxy (Next.js 16+ successor to middleware.ts).
 *
 * VaultLua uses a hash-router for the dashboard UI (everything renders on `/`),
 * and authentication is enforced at the API route level via `getCurrentUser()`
 * in src/lib/session.ts. We don't use middleware-level route protection —
 * every protected API route calls getCurrentUser() and returns 401 if not
 * signed in.
 *
 * The proxy mounts Clerk's middleware so:
 *   - the Clerk session cookie is set on every request
 *   - `auth()` in server components / API routes can read the session
 *
 * NOTE on the handshake redirect issue: the space-z.ai gateway sometimes
 * forwards the internal fcapp.run hostname in the Host header, causing Clerk
 * to redirect to that internal URL. If you see this, set NEXT_PUBLIC_APP_URL
 * to the public domain in your deployment platform's env vars.
 *
 * See: https://clerk.com/docs/nextjs/proxying-requests
 */
export default clerkMiddleware();

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
