import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasProfileAndReturn } from "@/utils/profileChecker";
import ProfilePage from "@/components/ProfilePage";

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

  // Count user's polls
  const { count: pollCount } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <ProfilePage
      profile={profile}
      email={user.email || ""}
      memberSince={user.created_at}
      pollCount={pollCount || 0}
    />
  );
}
