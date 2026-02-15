// lib/webhookDispatcher.ts — Server-only webhook dispatcher
import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";

export type WebhookEvent =
  | "vote.created"
  | "poll.created"
  | "poll.updated"
  | "poll.deleted";

/**
 * Dispatch a webhook event to all active webhooks for a user that match the event.
 * This is fire-and-forget: it logs errors but never throws.
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch all active webhooks for this user that listen for this event
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("id, url, secret, events")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("[webhookDispatcher] Error fetching webhooks:", error);
      return;
    }

    if (!webhooks || webhooks.length === 0) return;

    // Filter webhooks that subscribe to this event
    const matching = webhooks.filter(
      (wh) => Array.isArray(wh.events) && wh.events.includes(event),
    );

    if (matching.length === 0) return;

    const timestamp = new Date().toISOString();

    // Fire-and-forget: send all webhooks in parallel, don't await the overall result
    const promises = matching.map(async (webhook) => {
      try {
        const body = JSON.stringify({ event, payload, timestamp });

        // Create HMAC-SHA256 signature
        const signature = createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex");

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
          },
          body,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.error(
            `[webhookDispatcher] Webhook ${webhook.id} returned ${response.status}: ${response.statusText}`,
          );
        }

        // Update last_triggered_at regardless of response status
        await supabase
          .from("webhooks")
          .update({ last_triggered_at: new Date().toISOString() })
          .eq("id", webhook.id);
      } catch (err) {
        console.error(
          `[webhookDispatcher] Failed to deliver webhook ${webhook.id}:`,
          err,
        );
      }
    });

    // Fire all but don't block the caller
    Promise.allSettled(promises).catch(() => {
      // Silently ignore — individual errors are already logged above
    });
  } catch (err) {
    console.error("[webhookDispatcher] Unexpected error:", err);
  }
}
