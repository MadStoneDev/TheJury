// lib/rateLimit.ts — In-memory token bucket rate limiter

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  interval: number; // refill window in seconds
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup: purge entries older than 10 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min
const MAX_AGE = 10 * 60 * 1000; // 10 min

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > MAX_AGE) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

const defaultConfig: RateLimitConfig = {
  maxTokens: 10,
  refillRate: 10,
  interval: 60,
};

export function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {},
): { success: boolean; remaining: number } {
  const { maxTokens, interval } = { ...defaultConfig, ...config };
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { tokens: maxTokens - 1, lastRefill: now });
    return { success: true, remaining: maxTokens - 1 };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - entry.lastRefill) / 1000;
  const tokensToAdd = Math.floor((elapsed / interval) * maxTokens);

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    return { success: false, remaining: 0 };
  }

  entry.tokens -= 1;
  return { success: true, remaining: entry.tokens };
}

export function getIPFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  return "unknown";
}
