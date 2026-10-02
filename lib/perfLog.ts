// Temporary performance instrumentation. Gated by an env flag so it can stay in
// the codebase and be switched off later.
//
//   Server paths (middleware, server components, server actions) — set
//     PERF_LOG=1  (runtime env on Coolify; no rebuild, just restart).
//   Client paths (dashboard list, cast-vote) and Edge middleware — set
//     NEXT_PUBLIC_PERF_LOG=1  (inlined at build; needs a rebuild).
//
// Logs look like:  [perf] profile.getUser 1843ms ok   /   [perf] ... ERR <msg>
// Remove this file and its call sites once the slowness is diagnosed.

const ENABLED =
  process.env.PERF_LOG === "1" || process.env.NEXT_PUBLIC_PERF_LOG === "1";

export function perfEnabled(): boolean {
  return ENABLED;
}

export function perfLog(message: string): void {
  if (ENABLED) console.log(`[perf] ${message}`);
}

function clock(): () => number {
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  return () =>
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
    start;
}

/**
 * Await `fn`, logging how long it took and whether it resolved or threw.
 * If `timeoutMs` is given the timeout is ALWAYS enforced (even when logging is
 * off) so a hung call surfaces as a rejection instead of blocking forever.
 */
export async function timed<T>(
  label: string,
  // PromiseLike, not Promise: Supabase query builders are thenables, not real
  // Promises, so they must be accepted here too.
  fn: () => PromiseLike<T>,
  timeoutMs?: number,
): Promise<T> {
  if (!ENABLED && timeoutMs === undefined) return fn();
  const elapsed = clock();
  try {
    const result =
      timeoutMs === undefined
        ? await fn()
        : await Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
              setTimeout(
                () =>
                  reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
                timeoutMs,
              ),
            ),
          ]);
    perfLog(`${label} ${elapsed().toFixed(0)}ms ok`);
    return result;
  } catch (err) {
    perfLog(
      `${label} ${elapsed().toFixed(0)}ms ERR ${
        (err as Error)?.message ?? String(err)
      }`,
    );
    throw err;
  }
}
