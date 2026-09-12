import type { Metadata } from "next";
import UseCasePlaceholder from "@/components/UseCasePlaceholder";

export const metadata: Metadata = {
  title: "Polls for Gaming Groups & Communities | TheJury",
  description:
    "Settle the debate with your Discord server, guild, or friend group. Quick polls for game night, next map, squad decisions and community votes.",
  alternates: { canonical: "/for/gaming-groups" },
};

export default function GamingGroupsPage() {
  return (
    <UseCasePlaceholder
      eyebrow="Gaming groups & communities"
      title="Let your community"
      highlight="decide"
      description="From 'which game tonight?' to guild rule changes, drop a poll in your Discord, group chat or stream and get a clear answer in seconds."
      points={[
        "Share to Discord, WhatsApp or anywhere with a single link",
        "Live results your whole squad can watch update in real time",
        "No sign-up required for voters",
        "Embed a poll straight into your stream overlay or community site",
      ]}
    />
  );
}
