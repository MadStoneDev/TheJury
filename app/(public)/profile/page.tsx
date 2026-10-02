import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasProfileAndReturn } from "@/utils/profileChecker";
import ProfilePage from "@/components/ProfilePage";
import type { TierName } from "@/lib/stripe";
import { timed, perfLog } from "@/lib/perfLog";

// If an auth/DB call hangs, fail fast and visibly rather than hang forever.
const CALL_TIMEOUT_MS = 8000;

export default async function ProfileRoute() {
  const supabase = await createClient();

  // One auth round-trip: getUser() gives id, email and created_at. The middleware
  // has already refreshed the session, so we don't also call getClaims() here,
  // and we hand the user to ensureUserHasProfileAndReturn so it doesn't re-auth.
  let user;
  try {
    const { data, error } = await timed(
      "profile.getUser",
      () => supabase.auth.getUser(),
      CALL_TIMEOUT_MS,
    );
    if (error) perfLog(`profile.getUser returned error: ${error.message}`);
    user = data?.user ?? null;
  } catch (err) {
    perfLog(`profile.getUser threw: ${(err as Error)?.message}`);
    user = null;
  }
  if (!user) redirect("/auth/login");

  let profile;
  try {
    profile = await timed(
      "profile.ensureProfile",
      () => ensureUserHasProfileAndReturn(user, supabase),
      CALL_TIMEOUT_MS,
    );
  } catch (err) {
    perfLog(`profile.ensureProfile threw: ${(err as Error)?.message}`);
    profile = null;
  }
  if (!profile) redirect("/auth/login");

  let pollCount = 0;
  try {
    const { count, error } = await timed(
      "profile.pollCount",
      () =>
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      CALL_TIMEOUT_MS,
    );
    if (error) perfLog(`profile.pollCount returned error: ${error.message}`);
    pollCount = count || 0;
  } catch (err) {
    // Non-fatal: show the page with a 0 count rather than hang/500.
    perfLog(`profile.pollCount threw: ${(err as Error)?.message}`);
  }

  return (
    <ProfilePage
      profile={profile}
      userId={user.id}
      email={user.email || ""}
      memberSince={user.created_at}
      pollCount={pollCount}
      subscriptionTier={(profile.subscription_tier as TierName) || "free"}
      subscriptionStatus={profile.subscription_status || null}
      currentPeriodEnd={profile.current_period_end || null}
    />
  );
}
