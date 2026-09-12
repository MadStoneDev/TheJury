import type { Metadata } from "next";
import UseCasePlaceholder from "@/components/UseCasePlaceholder";

export const metadata: Metadata = {
  title: "Polls for Teams | TheJury",
  description:
    "Make faster team decisions. Run quick polls for standups, retros, planning and feedback — and see where everyone stands at a glance.",
  alternates: { canonical: "/for/teams" },
};

export default function TeamsPage() {
  return (
    <UseCasePlaceholder
      eyebrow="Teams"
      title="Help your team"
      highlight="decide"
      description="Cut the endless thread. Poll your team on priorities, meeting times, retros and feedback, then act on a clear result instead of the loudest voice."
      points={[
        "Anonymous responses for honest feedback",
        "Schedule polls to open and close on their own",
        "Real-time results in one shared dashboard",
        "Rating and ranked-choice questions for nuanced decisions",
      ]}
    />
  );
}
