import type { Metadata } from "next";
import UseCasePlaceholder from "@/components/UseCasePlaceholder";

export const metadata: Metadata = {
  title: "Polls for Creators | TheJury",
  description:
    "Engage your audience with live polls. Let followers pick your next video, vote on ideas, and react in real time on your stream or site.",
  alternates: { canonical: "/for/creators" },
};

export default function CreatorsPage() {
  return (
    <UseCasePlaceholder
      eyebrow="Creators"
      title="Let your audience"
      highlight="decide"
      description="Turn viewers into participants. Ask what to make next, run live audience votes during a stream, and embed polls anywhere your community hangs out."
      points={[
        "Embed polls into your blog, stream overlay or link-in-bio",
        "Live results that animate as votes roll in",
        "Custom embed themes to match your brand",
        "QR codes to bring an in-person audience online",
      ]}
    />
  );
}
