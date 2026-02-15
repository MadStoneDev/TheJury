// lib/apiAuth.ts — Server-only API key authentication
import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Hash an API key using SHA-256.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key with `jury_` prefix.
 * Returns the raw key (shown once), the prefix (for display), and the hash (stored in DB).
 */
export function generateApiKey(): {
  key: string;
  prefix: string;
  hash: string;
} {
  const raw = randomBytes(16).toString("hex"); // 32 hex chars
  const key = `jury_${raw}`;
  const prefix = key.substring(0, 12); // "jury_" + first 7 hex chars
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

/**
 * Validate an API key from the Authorization header.
 * Returns the userId and scopes if valid, or null if invalid/expired.
 */
export async function validateApiKey(
  request: Request,
): Promise<{ userId: string; scopes: string[] } | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const key = authHeader.slice(7).trim();
    if (!key || !key.startsWith("jury_")) {
      return null;
    }

    const keyHash = hashApiKey(key);
    const supabase = await createClient();

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .select("id, user_id, scopes, expires_at")
      .eq("key_hash", keyHash)
      .single();

    if (error || !apiKey) {
      return null;
    }

    // Check expiry
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null;
    }

    // Update last_used_at (fire-and-forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id)
      .then(() => {});

    return {
      userId: apiKey.user_id,
      scopes: apiKey.scopes || [],
    };
  } catch (err) {
    console.error("[apiAuth] Error validating API key:", err);
    return null;
  }
}
