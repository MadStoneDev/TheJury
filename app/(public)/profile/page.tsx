import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasProfileAndReturn } from "@/utils/profileChecker";
import ProfilePage from "@/components/ProfilePage";
import type { TierName } from "@/lib/stripe";

export default async function ProfileRoute() {
  const supabase = await createClient();

  const { data, error: supabaseError } = await supabase.auth.getClaims();
  if (supabaseError || !data?.claims) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await ensureUserHasProfileAndReturn();
  if (!profile) {
    redirect("/auth/login");
  }

  // Fetch poll count and subscription info in parallel (profile already has sub data)
  const [{ count: pollCount }] = await Promise.all([
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <ProfilePage
      profile={profile}
      userId={user.id}
      email={user.email || ""}
      memberSince={user.created_at}
      pollCount={pollCount || 0}
      subscriptionTier={(profile.subscription_tier as TierName) || "free"}
      subscriptionStatus={profile.subscription_status || null}
      currentPeriodEnd={profile.current_period_end || null}
    />
  );
}
