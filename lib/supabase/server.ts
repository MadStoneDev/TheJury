import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { perfLog, perfEnabled } from "@/lib/perfLog";

// Server-side Supabase base URL. Today this is the PUBLIC domain, which means
// server→Supabase calls may hairpin out through DNS/the reverse proxy and back
// into the same box. If an internal Docker-network URL is available on Coolify,
// setting SUPABASE_INTERNAL_URL would let the server talk to Supabase directly;
// the browser still needs the public NEXT_PUBLIC_SUPABASE_URL. We only READ the
// internal var here for diagnosis — the client still uses the public URL until
// we've measured and confirmed.
const SERVER_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
let loggedUrl = false;

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  if (perfEnabled() && !loggedUrl) {
    loggedUrl = true;
    perfLog(
      `server supabase url = ${SERVER_SUPABASE_URL} (SUPABASE_INTERNAL_URL ${
        process.env.SUPABASE_INTERNAL_URL ? "is set" : "not set"
      })`,
    );
  }

  return createServerClient(
    SERVER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
