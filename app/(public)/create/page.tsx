// pages/create/page.tsx
import PollForm from "@/components/PollForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserHasProfile } from "@/utils/profileChecker";

export default async function CreatePollPage() {
  const supabase = await createClient();

  const { data, error: supabaseError } = await supabase.auth.getClaims();
  if (supabaseError || !data?.claims) {
    redirect("/auth/login");
  }

  const hasProfile = await ensureUserHasProfile();
  if (!hasProfile) {
    // Handle error - maybe redirect to signup
    redirect("/auth/login");
  }

  return <PollForm />;
}
