// app/api/health/route.ts
// Uptime health check. Reports up/down for the site, Supabase Auth and the
// database, without ever revealing keys, URLs or error detail. No auth required
// — it exposes only status. Kept out of any static render / cache so every hit
// reflects live state.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;

// "ok" | "timeout" | "error" (network/config) | "error <http status>"
type Check = "ok" | "timeout" | "error" | `error ${number}`;

/** Drop trailing slash(es) so we can join paths cleanly. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** GET a URL with a hard timeout; never throws, never leaks detail. */
async function probe(
  url: string,
  headers?: Record<string, string>,
): Promise<Check> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok ? "ok" : (`error ${res.status}` as Check);
  } catch (err) {
    const name = (err as { name?: string } | null)?.name;
    return name === "AbortError" || name === "TimeoutError" ? "timeout" : "error";
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(): Promise<NextResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const healthTable = process.env.HEALTH_TABLE;

  const supabaseBase = supabaseUrl ? stripTrailingSlash(supabaseUrl) : null;

  // 1. Site: the root path only (never this route — would recurse).
  const siteCheck: Promise<Check> = appUrl
    ? probe(`${stripTrailingSlash(appUrl)}/`)
    : Promise.resolve<Check>("error");

  // 2. Supabase Auth (GoTrue) health.
  const authCheck: Promise<Check> =
    supabaseBase && anonKey
      ? probe(`${supabaseBase}/auth/v1/health`, { apikey: anonKey })
      : Promise.resolve<Check>("error");

  // 3. Database via PostgREST. Prove it answers by reading one id from a small
  // anon-readable table; if none is configured, hit the PostgREST root instead
  // (the trailing slash is required — Kong won't route "/rest/v1" without it).
  const dbCheck: Promise<Check> =
    supabaseBase && anonKey
      ? probe(
          healthTable
            ? `${supabaseBase}/rest/v1/${healthTable}?select=id&limit=1`
            : `${supabaseBase}/rest/v1/`,
          { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        )
      : Promise.resolve<Check>("error");

  const [site, auth, db] = await Promise.all([siteCheck, authCheck, dbCheck]);

  const allOk = site === "ok" && auth === "ok" && db === "ok";

  return NextResponse.json(
    {
      status: allOk ? "ok" : "fail",
      site,
      auth,
      db,
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
