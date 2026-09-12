// Client-safe landing-stats helpers and types.
// The server-only fetch lives in lib/landingStats.server.ts so this module can
// be imported from client components (e.g. the hero) without pulling in
// next/headers.

export interface LandingStats {
  pollCount: number;
  voteCount: number;
  /** Whether the numbers are large enough to be worth showing. */
  show: boolean;
}

/** Round a count down to a clean "40+" style figure. Never rounds up. */
export function roundStat(n: number): string {
  if (n < 10) return String(n);
  let step = 10;
  if (n >= 10_000) step = 1_000;
  else if (n >= 1_000) step = 100;
  else if (n >= 100) step = 50;
  const floored = Math.floor(n / step) * step;
  return `${floored.toLocaleString()}+`;
}
