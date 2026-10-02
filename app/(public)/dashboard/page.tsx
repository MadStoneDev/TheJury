// dashboard/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PollDashboardPage from "@/components/PollDashboardPage";
import { ensureUserHasProfile } from "@/utils/profileChecker";
import { timed, perfLog } from "@/lib/perfLog";

const CALL_TIMEOUT_MS = 8000;

export const metadata: Metadata = {
  title: "Dashboard | TheJury",
  description: "Your polls, results and settings.",
  robots: { index: false, follow: false },
};

export default async function PollDashboard() {
  const supabase = await createClient();

  // One auth round-trip: getUser() authenticates and is handed to
  // ensureUserHasProfile so it doesn't call getUser() again.
  let user;
  try {
    const { data, error } = await timed(
      "dashboard.getUser",
      () => supabase.auth.getUser(),
      CALL_TIMEOUT_MS,
    );
    if (error) perfLog(`dashboard.getUser returned error: ${error.message}`);
    user = data?.user ?? null;
  } catch (err) {
    perfLog(`dashboard.getUser threw: ${(err as Error)?.message}`);
    user = null;
  }
  if (!user) redirect("/auth/login");

  let hasProfile = false;
  try {
    hasProfile = await timed(
      "dashboard.ensureProfile",
      () => ensureUserHasProfile(user, supabase),
      CALL_TIMEOUT_MS,
    );
  } catch (err) {
    perfLog(`dashboard.ensureProfile threw: ${(err as Error)?.message}`);
  }
  if (!hasProfile) redirect("/auth/login");

  return <PollDashboardPage />;
}
