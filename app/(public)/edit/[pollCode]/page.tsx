// pages/edit/[pollCode]/page.tsx
import { notFound, redirect } from "next/navigation";
import PollForm from "@/components/PollForm";
import { createClient } from "@/lib/supabase/server";

interface EditPollPageProps {
  params: {
    pollCode: string;
  };
}

export default async function EditPollPage({ params }: EditPollPageProps) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { pollCode } = params;

  if (!pollCode) {
    notFound();
  }

  return <PollForm pollCode={pollCode} />;
}
