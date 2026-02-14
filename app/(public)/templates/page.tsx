import { createClient } from "@/lib/supabase/server";
import type { TierName } from "@/lib/stripe";
import TemplateCards from "@/components/TemplateCards";
import { ScrollReveal } from "@/components/motion";

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
    <div className="min-h-screen bg-background py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
              Poll Templates
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start with a pre-built template and customise it to fit your
              needs. Save time and get better results.
            </p>
          </div>
        </ScrollReveal>

        <TemplateCards userTier={currentTier} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
