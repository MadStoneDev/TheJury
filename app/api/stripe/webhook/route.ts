import { NextResponse } from "next/server";
import { getStripe, getTierByPriceId } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Use service role client to bypass RLS (webhook has no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Find the Supabase user ID for a Stripe customer.
 * Checks: 1) checkout session metadata, 2) profiles.stripe_customer_id,
 * 3) Stripe customer metadata.
 */
async function resolveUserId(
  supabase: ReturnType<typeof createServiceClient>,
  stripe: Stripe,
  customerId: string | null,
  sessionMetadataUserId?: string | null,
): Promise<string | null> {
  // 1. Checkout session metadata
  if (sessionMetadataUserId) return sessionMetadataUserId;

  if (!customerId) return null;

  // 2. Look up by stripe_customer_id in profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (profile?.id) return profile.id;

  // 3. Stripe customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted && customer.metadata?.userId) {
    return customer.metadata.userId;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;
        const tier = priceId ? getTierByPriceId(priceId) : "free";
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const periodEnd = subItem?.current_period_end;

        const userId = await resolveUserId(
          supabase,
          stripe,
          customerId ?? null,
          session.metadata?.userId,
        );

        if (!userId) {
          console.error(
            "Webhook: Could not resolve user for checkout session",
            session.id,
            "customer:",
            customerId,
          );
          break;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Webhook: Failed to update profile for user",
            userId,
            updateError,
          );
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;
        const tier = priceId ? getTierByPriceId(priceId) : "free";
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        const periodEnd = subItem?.current_period_end;

        const userId = await resolveUserId(
          supabase,
          stripe,
          customerId ?? null,
        );

        if (!userId) {
          console.error(
            "Webhook: Could not resolve user for subscription.updated",
            subscription.id,
            "customer:",
            customerId,
          );
          break;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Webhook: Failed to update profile for user",
            userId,
            updateError,
          );
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        const userId = await resolveUserId(
          supabase,
          stripe,
          customerId ?? null,
        );

        if (!userId) {
          console.error(
            "Webhook: Could not resolve user for subscription.deleted",
            subscription.id,
          );
          break;
        }

        await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: null,
            subscription_id: null,
            current_period_end: null,
          })
          .eq("id", userId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const userId = await resolveUserId(
            supabase,
            stripe,
            customerId,
          );

          if (userId) {
            await supabase
              .from("profiles")
              .update({ subscription_status: "past_due" })
              .eq("id", userId);
          }
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
