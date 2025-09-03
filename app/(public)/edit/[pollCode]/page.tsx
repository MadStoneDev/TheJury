// pages/edit/[pollCode]/page.tsx
import { notFound, redirect } from "next/navigation";
import PollForm from "@/components/PollForm";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasProfile } from "@/utils/profileChecker";

interface EditPollPageProps {
  params: Promise<{
    pollCode: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditPollPage({ params }: EditPollPageProps) {
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

  const { pollCode } = await params; // Await the params Promise

  if (!pollCode) {
    notFound();
  }

  return <PollForm pollCode={pollCode} />;
}
