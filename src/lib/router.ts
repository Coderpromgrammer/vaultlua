"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * VaultLua hash router.
 *
 * The sandbox preview only renders the `/` route directly, so we use hash-based
 * routing to deliver a multi-page SaaS experience while keeping the entry point
 * on `/`. This is also a common pattern for SaaS dashboards that want
 * instant client-side navigation.
 *
 * Routes look like: `#/dashboard`, `#/projects/vlx-7f3a`, `#/ads/get-key/abc`
 */

export type RouteParams = Record<string, string>;

export interface ParsedRoute {
  path: string; // e.g. "/projects/vlx-7f3a"
  segments: string[]; // e.g. ["projects", "vlx-7f3a"]
  query: URLSearchParams;
}

function parseHash(): ParsedRoute {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryStr] = raw.split("?");
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  return {
    path: cleanPath,
    segments: cleanPath.split("/").filter(Boolean),
    query: new URLSearchParams(queryStr ?? ""),
  };
}

export function useRouter() {
  const [route, setRoute] = useState<ParsedRoute>({
    path: "/",
    segments: [],
    query: new URLSearchParams(),
  });

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    onChange();
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const push = useCallback((path: string) => {
    const clean = path.startsWith("/") ? path : "/" + path;
    window.location.hash = "#" + clean;
    // Scroll to top on navigation
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
  }, []);

  const replace = useCallback((path: string) => {
    const clean = path.startsWith("/") ? path : "/" + path;
    window.location.replace("#" + clean);
  }, []);

  const back = useCallback(() => window.history.back(), []);

  return { ...route, push, replace, back };
}

/**
 * Match the current path against a pattern like "/projects/:id".
 * Returns null if no match, or the extracted params.
 */
export function matchPath(
  pattern: string,
  path: string
): RouteParams | null {
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = path.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return null;
  const params: RouteParams = {};
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i];
    const s = pathSegs[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(s);
    } else if (p !== s) {
      return null;
    }
  }
  return params;
}

/**
 * Subscribe to route changes from outside React (e.g. for command palette).
 */
export function navigate(path: string) {
  const clean = path.startsWith("/") ? path : "/" + path;
  window.location.hash = "#" + clean;
}
