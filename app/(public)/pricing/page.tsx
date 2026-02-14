import { createClient } from "@/lib/supabase/server";
import {
  TIERS,
  getProPriceId,
  getTeamPriceId,
  getProAnnualPriceId,
  getTeamAnnualPriceId,
  type TierName,
} from "@/lib/stripe";
import PricingCards from "@/components/PricingCards";
import { ScrollReveal } from "@/components/motion";

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
    <div className="min-h-screen bg-background py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-display text-foreground mb-4">
              Simple,{" "}
              <span className="gradient-text">transparent</span>{" "}
              pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free with up to 5 active polls. Upgrade for unlimited
              polls, advanced question types, and more.
            </p>
          </div>
        </ScrollReveal>

        <PricingCards
          tiers={{
            ...TIERS,
            pro: {
              ...TIERS.pro,
              priceId: getProPriceId(),
              priceIdAnnual: getProAnnualPriceId(),
            },
            team: {
              ...TIERS.team,
              priceId: getTeamPriceId(),
              priceIdAnnual: getTeamAnnualPriceId(),
            },
          }}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
        />

        <p className="text-center text-xs text-muted-foreground mt-8">
          All prices shown in your selected currency. Billed in AUD.
        </p>
      </div>
    </div>
  );
}
