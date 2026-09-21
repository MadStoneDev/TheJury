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

const ACCENT = "presenters" as const;

export const metadata: Metadata = {
  title: "Live polling tool for presenters | TheJury",
  description:
    "A live polling tool made in Australia. Put a six-character code on screen, let the room vote from any phone with no app, and watch results update live. A simpler local option for small rooms.",
  alternates: { canonical: "/for/presenters" },
  openGraph: {
    title: "Live polling tool for presenters | TheJury",
    description:
      "Put a code on screen and poll the room live. An Australian live polling tool for trainers, facilitators and speakers, with no app to install.",
    url: "/for/presenters",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for presenters",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "An Australian live polling tool for trainers, facilitators, conference speakers and workshop leaders: a six-character code on screen, live results on the projector, and an embed that works in any slide deck.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

/** Mock: the six-character code as it appears on the projector. */
function OnScreenCode() {
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-jury-text">
          On the projector
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-jury-emerald-tint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-jury-emerald-hi">
          <span className="h-1.5 w-1.5 rounded-full bg-jury-emerald animate-pulse" />
          Live
        </span>
      </div>
      <p className="mt-4 text-[13px] text-jury-dim">Vote at thejury.app</p>
      <div className="mt-2 rounded-[10px] border border-jury-border bg-jury-input px-4 py-5 text-center">
        <span className="font-mono text-[34px] font-semibold tracking-[0.3em] text-presenters-text">
          WORK42
        </span>
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        No app, no account. The room types the code and votes from any phone.
      </p>
    </div>
  );
}

export default function PresentersPage() {
  return (
    <div className="bg-jury-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UseCaseHero
        accent={ACCENT}
        eyebrow="For presenters & trainers"
        title="Poll the room while you talk."
        lead="A six-character code goes on the screen, the room votes from any phone, and the results come up on the projector. No app to install, and nothing to hand out."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "See pricing", href: "/pricing" }}
        visual={<OnScreenCode />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="A code on screen"
        title="Everyone's in within ten seconds"
        body="Show the code, and the room is voting before you finish the sentence. Voters do not need an account, an email or a download, so you keep the session moving instead of waiting on sign-ups."
        checklist={[
          "A six-character code, a link or a QR code",
          "No app and no account for the people voting",
          "Works on any phone in the room",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Which topic should we dig into next?"
            meta="Workshop · live"
            code="WORK42"
            options={[
              { label: "Difficult conversations", pct: 44 },
              { label: "Time management", pct: 33 },
              { label: "Giving feedback", pct: 23 },
            ]}
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="In your slides"
        title="Drop a live poll into any deck"
        body="Add the poll to a slide as an embedded browser window, or open it in a browser tab beside your deck. It runs the same in a training room, a hall or a conference stage."
        checklist={[
          "Embed the poll in a browser window inside your slides",
          "Or run it in a browser tab next to the deck",
          "Themed to sit tidily against your slides",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="How confident are you with the new process?"
            meta="Embedded in the deck · live"
            options={[
              { label: "Confident", pct: 38 },
              { label: "Getting there", pct: 45 },
              { label: "Need a hand", pct: 17 },
            ]}
            footer="Live results · updates as the room votes"
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Read the room"
        title="Results the whole room can watch"
        body="The chart fills in as votes land, so the room sees the picture form together. Use it for a quick check-in at the start, a pulse check in the middle, or a show of where people ended up."
        checklist={[
          "Live bar, pie or donut charts",
          "Good for check-ins, pulse checks and quick votes",
          "Single choice, ratings, ranked choice and more",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="How was the session for you?"
            meta="Session check-in · live"
            options={[
              { label: "Really useful", pct: 56 },
              { label: "Some of it", pct: 32 },
              { label: "Not for me", pct: 12 },
            ]}
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="A local option"
        title="A simpler alternative for small rooms"
        body="If you have reached for Mentimeter or Slido before, TheJury is the smaller, Australian option for everyday sessions. It is hosted in Australia, so the answers your room gives stay here. You can read how the data is handled on the security page."
        checklist={[
          "Made and hosted in Australia",
          "Straightforward pricing for regular presenters",
          "Enough for most training rooms and talks",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="Where do you run most of your sessions?"
            meta="Poll · 128 responses"
            options={[
              { label: "Training rooms", pct: 48 },
              { label: "Conferences", pct: 29 },
              { label: "Online", pct: 23 },
            ]}
            footer="Hosted in Australia"
          />
        }
      />

      <PricingTeaser
        sub="Start free, then upgrade when you present often enough to want branding gone."
        proDescription="Every question type, branded embeds and no TheJury branding on the poll."
      />

      <CtaBand
        accent={ACCENT}
        title="Give the room a say"
        body="Set up a poll before your next session and put the code on screen. The room is voting within seconds, and you can see the answers as they land."
        cta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "See pricing", href: "/pricing" }}
      />
    </div>
  );
}
