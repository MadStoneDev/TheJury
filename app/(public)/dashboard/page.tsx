// dashboard/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PollDashboardPage from "@/components/PollDashboardPage";
import { ensureUserHasProfile } from "@/utils/profileChecker";

export const metadata: Metadata = {
  title: "Dashboard | TheJury",
  description: "Your polls, results and settings.",
  robots: { index: false, follow: false },
};

export default async function PollDashboard() {
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

  return <PollDashboardPage />;
}
