import { createClient } from "@/lib/supabase/server";
import type { TierName } from "@/lib/stripe";
import TemplateCards from "@/components/TemplateCards";

export default async function TemplatesPage() {
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
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h1 className="font-display text-[36px] leading-[1.1] text-jury-text sm:text-[48px]">
            Poll templates
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-jury-muted sm:text-[18px]">
            Start from a pre-built template and customise it to fit your needs —
            save time and get better results.
          </p>
        </div>

        <TemplateCards userTier={currentTier} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
