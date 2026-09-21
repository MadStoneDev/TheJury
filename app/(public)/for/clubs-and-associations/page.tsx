import type { Metadata } from "next";
import { UseCaseHero } from "@/components/design/useCase/UseCaseHero";
import { FeatureRow } from "@/components/design/useCase/FeatureRow";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";
import { PollResultCard } from "@/components/design/PollResultCard";

// NOTE ON CLAIMS: lines marked `CLAIM-FLAG` describe target-state features
// (server-enforced anonymous voting, verified one-link-per-member voting) that
// are not fully built yet. Confirm the implementation before this goes live.
// See lib/marketing/audiences.ts and the /security page.

const ACCENT = "clubs" as const;

export const metadata: Metadata = {
  title: "Online voting for your AGM | TheJury",
  description:
    "Online voting for an AGM in Australia. Put motions to your members, run the committee election with one link per person, and keep a clear results record for the minutes.",
  alternates: { canonical: "/for/clubs-and-associations" },
  openGraph: {
    title: "Online voting for your AGM | TheJury",
    description:
      "AGM motions, committee elections and member consultation, hosted in Australia. A results record you can attach to the minutes.",
    url: "/for/clubs-and-associations",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for clubs and associations",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Australian-hosted voting for clubs, incorporated associations and bodies corporate: AGM motions and committee elections with one link per member, member consultation, and a downloadable results record for the minutes.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

/** Mock: a committee election ballot, choose up to the positions open. */
function ElectionBallot() {
  const candidates = [
    { name: "Karen Nguyen", pct: 74 },
    { name: "Dave Mitchell", pct: 61 },
    { name: "Priya Sharma", pct: 58 },
    { name: "Tom Kelly", pct: 39 },
    { name: "Fiona Papadopoulos", pct: 33 },
  ];
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-jury-text">
          Committee election
        </h3>
        <span className="rounded-md bg-jury-input px-2 py-1 text-[12px] text-jury-dim">
          Choose up to 3
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {candidates.map((c) => (
          <div
            key={c.name}
            className="relative overflow-hidden rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-[10px]"
              style={{ width: `${c.pct}%`, background: "rgba(143,176,232,0.16)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-[14px] text-jury-body">{c.name}</span>
              <span className="text-[13px] font-semibold text-clubs-text">
                {c.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        One ballot per member. The top three take the positions open.
      </p>
    </div>
  );
}

export default function ClubsAndAssociationsPage() {
  return (
    <div className="bg-jury-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UseCaseHero
        accent={ACCENT}
        eyebrow="For clubs & associations"
        title="Online voting for your AGM."
        lead="Put motions to the members, run the committee election, and consult on a rule change before you table it. Hosted in Australia, with a results record you can attach to the minutes."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="That the amended constitution be adopted"
            meta="Annual general meeting · 12 November"
            code="AGM24"
            options={[
              { label: "For", pct: 71 },
              { label: "Against", pct: 18 },
              { label: "Abstain", pct: 11 },
            ]}
            footer="Verified vote · one link per financial member"
          />
        }
      />

      {/* CLAIM-FLAG (verified-voting): one-link-per-member verified voting is
          target-state; confirm before publishing. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="AGM motions"
        title="Carry the motion with a clear count"
        body="Send each financial member their own private link, put the motion, and finish with a tidy count of for, against and abstain. It helps you keep a clear record you can attach to the minutes. It suits incorporated associations and strata bodies corporate that need the vote written down."
        checklist={[
          "One private link per member, one vote each",
          "For, against and abstain on every motion",
          "A record with the question, counts and open and close times",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="That the 2024 financial report be received"
            meta="AGM · second motion"
            options={[
              { label: "For", pct: 82 },
              { label: "Against", pct: 9 },
              { label: "Abstain", pct: 9 },
            ]}
            footer="Verified vote · results record ready to download"
          />
        }
      />

      {/* CLAIM-FLAG (verified-voting): verified committee elections are
          target-state; confirm before publishing. */}
      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Committee elections"
        title="Run the committee election online"
        body="Stand the candidates, let members choose up to the number of positions open, and read the result the moment voting closes. One ballot per member, counted the same way every time, with the outcome ready to save for the record."
        checklist={[
          "Choose up to the positions open, one ballot per member",
          "Private links so only eligible members vote",
          "Download the outcome for the minutes",
        ]}
        visual={<ElectionBallot />}
      />

      {/* CLAIM-FLAG (anonymous-voting): server-enforced anonymity is
          target-state; confirm before publishing. See /security. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Member consultation"
        title="Test a rule change before you table it"
        body="Before a rule change reaches the floor, ask the membership where they sit. Anonymous responses get you the honest read, and a comment box catches the reasoning you would otherwise miss."
        checklist={[
          "Agree, disagree or unsure, plus an optional comment",
          "Anonymous, so people say what they think",
          "No account needed to respond",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="Raise annual membership fees by $20?"
            meta="Anonymous · member consultation"
            options={[
              { label: "Agree", pct: 44 },
              { label: "Disagree", pct: 38 },
              { label: "Unsure", pct: 18 },
            ]}
            footer="Anonymous responses · no names recorded"
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Dates & events"
        title="Pick the date for the working bee"
        body="Post the options for the working bee or the presentation night and let members tick every date they can make. You choose with the whole picture, not just the three people who replied to the email."
        checklist={[
          "Multi-select date polls",
          "Share a link, a QR code or a six-character code",
          "Member data hosted in Australia",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Which Saturday for the working bee?"
            meta="Tick every date you can make"
            options={[
              { label: "6 April", pct: 57 },
              { label: "13 April", pct: 44 },
              { label: "20 April", pct: 31 },
            ]}
            footer="Multi-select · 48 responses"
          />
        }
      />

      <PricingTeaser
        sub="Most clubs start on the free tier and upgrade for their first verified vote."
        proDescription="Anonymous and verified voting, the results record and no TheJury branding on the poll."
      />

      <CtaBand
        accent={ACCENT}
        title="Put it to the members"
        body="Write the motion, send the links, and finish with a record for the minutes. Your member data stays in Australia the whole way."
        cta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
      />
    </div>
  );
}
