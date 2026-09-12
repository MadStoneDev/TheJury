import { createClient } from "@/lib/supabase/server";
import {
  TIERS,
  getProPriceId,
  getProAnnualPriceId,
  getProLifetimePriceId,
  type TierName,
} from "@/lib/stripe";
import PricingCards from "@/components/PricingCards";

export default async function PricingPage() {
  const supabase = await createClient();

  let currentTier: TierName = "free";
  let isLoggedIn = false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    isLoggedIn = true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();
    if (profile?.subscription_tier) {
      currentTier = profile.subscription_tier as TierName;
    }
  }

  return (
    <div className="min-h-screen bg-jury-base">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-14 lg:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h1 className="font-display text-[36px] leading-[1.1] text-jury-text sm:text-[52px]">
            Simple, <span className="text-jury-emerald-hi">transparent</span>{" "}
            pricing
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-jury-muted sm:text-[18px]">
            Start free with unlimited polls and votes. Upgrade when you need every
            question type, branded embeds and your own branding.
          </p>
        </div>

        <PricingCards
          tiers={{
            ...TIERS,
            pro: {
              ...TIERS.pro,
              priceId: getProPriceId(),
              priceIdAnnual: getProAnnualPriceId(),
              priceIdLifetime: getProLifetimePriceId(),
            },
          }}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
