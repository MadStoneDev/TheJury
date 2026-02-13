import { createClient } from "@/lib/supabase/server";
import { TIERS, type TierName, type TierConfig } from "@/lib/stripe";

export interface UserSubscription {
  tier: TierName;
  status: string | null;
  currentPeriodEnd: string | null;
}

export async function getUserSubscription(
  userId: string,
): Promise<UserSubscription> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, current_period_end")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { tier: "free", status: null, currentPeriodEnd: null };
  }

  return {
    tier: (data.subscription_tier as TierName) || "free",
    status: data.subscription_status,
    currentPeriodEnd: data.current_period_end,
  };
}

export function getTierLimits(tier: TierName): TierConfig {
  return TIERS[tier] || TIERS.free;
}
