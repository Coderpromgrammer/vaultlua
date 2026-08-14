import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk proxy (Next.js 16+ successor to middleware.ts).
 *
 * VaultLua uses a hash-router for the dashboard UI (everything renders on `/`),
 * so most page loads are public. Only Next.js API routes that mutate state
 * require an authenticated Clerk session — those routes call `getCurrentUser()`
 * (in src/lib/session.ts) which internally calls Clerk's `auth()` and returns
 * null if not signed in, then the route responds with 401 Unauthorized.
 *
 * We still mount Clerk's middleware here so:
 *   - the Clerk proxy (/__clerk/*) works for the auth handshake
 *   - the Clerk session cookie is set on every request
 *   - per-route protection can be opted into later via `auth.protect()`
 *
 * See: https://clerk.com/docs/nextjs/proxying-requests
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (unless they start with "next")
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy path — required for Clerk's internal auth handshake
    "/__clerk/:path*",
  ],
};
