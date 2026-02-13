import { createClient } from "@/lib/supabase/server";
import { TIERS, getProPriceId, getTeamPriceId, type TierName } from "@/lib/stripe";
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free with up to 100 votes per poll. Upgrade when you need
            unlimited votes, custom branding, and more.
          </p>
        </div>

        <PricingCards
          tiers={{
            ...TIERS,
            pro: { ...TIERS.pro, priceId: getProPriceId() },
            team: { ...TIERS.team, priceId: getTeamPriceId() },
          }}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
