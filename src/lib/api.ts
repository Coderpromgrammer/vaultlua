import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const ApiError = {
  unauthorized: (msg = "Unauthorized") => jsonError(401, "unauthorized", msg),
  forbidden: (msg = "Forbidden") => jsonError(403, "forbidden", msg),
  notFound: (msg = "Not found") => jsonError(404, "not_found", msg),
  badRequest: (msg = "Bad request", details?: unknown) =>
    jsonError(400, "bad_request", msg, details),
  validation: (err: ZodError) =>
    jsonError(422, "validation_error", "Request validation failed", err.flatten()),
  rateLimited: (msg = "Rate limited") =>
    jsonError(429, "rate_limited", msg),
  serverError: (msg = "Internal server error") =>
    jsonError(500, "server_error", msg),
  conflict: (msg = "Conflict") => jsonError(409, "conflict", msg),
};

function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiPaginated<T>(
  items: T[],
  opts: { page: number; pageSize: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      page: opts.page,
      pageSize: opts.pageSize,
      total: opts.total,
      totalPages: Math.max(1, Math.ceil(opts.total / opts.pageSize)),
    },
  });
}

/**
 * Simple in-memory rate limiter keyed by IP or userId. Production should use
 * Redis or similar, but this gives us real protection in single-instance mode.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
