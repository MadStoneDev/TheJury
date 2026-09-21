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

const ACCENT = "businesses" as const;

export const metadata: Metadata = {
  title: "Anonymous staff surveys, hosted in Australia | TheJury",
  description:
    "Run an anonymous staff survey in Australia without sending your data to an overseas tool. Client and patient satisfaction, partner and board decisions, and a results record you can file.",
  alternates: { canonical: "/for/businesses" },
  openGraph: {
    title: "Anonymous staff surveys, hosted in Australia | TheJury",
    description:
      "Anonymous staff feedback, client satisfaction and board decisions for practices and firms with sensitive data. Hosted in Australia, no overseas processing.",
    url: "/for/businesses",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for businesses",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Australian-hosted polling for businesses that handle sensitive data: anonymous staff surveys, client and patient satisfaction, verified partner and board decisions, and a downloadable results record.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

/** Mock: front-desk satisfaction rating collected by QR code. */
function DeskRating() {
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-jury-text">
          After your appointment
        </h3>
        <span className="rounded-md bg-jury-input px-2 py-1 font-mono text-[12px] text-jury-dim">
          Front desk QR
        </span>
      </div>
      <p className="mt-3 text-[14px] text-jury-body">
        How was your visit today?
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`flex h-11 flex-1 items-center justify-center rounded-[10px] border text-[15px] font-semibold ${
              n >= 4
                ? "border-businesses/40 bg-businesses/[0.14] text-businesses-text"
                : "border-jury-border bg-jury-input text-jury-dim"
            }`}
          >
            {n}
          </span>
        ))}
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        Anonymous · no sign-in · 1 to 5 with one optional comment
      </p>
    </div>
  );
}

export default function BusinessesPage() {
  return (
    <div className="bg-jury-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UseCaseHero
        accent={ACCENT}
        eyebrow="For practices & firms"
        title="Ask the hard questions. Keep the answers here."
        lead="Anonymous staff feedback, client satisfaction and board decisions for organisations that can't put people's data in an overseas tool. Hosted in Australia, with a results record you can file."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="How supported do you feel at work right now?"
            meta="Anonymous staff pulse · 34 responses"
            options={[
              { label: "Well supported", pct: 44 },
              { label: "Mostly", pct: 33 },
              { label: "Stretched thin", pct: 23 },
            ]}
            footer="Anonymous responses · hosted in Australia"
          />
        }
      />

      {/* CLAIM-FLAG (anonymous-voting): server-enforced anonymity is
          target-state; confirm before publishing. See /security. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Staff feedback"
        title="Anonymous staff feedback that stays in Australia"
        body="Allied health, medical practices, law firms, accountants and financial advisers all sit on data they can't hand to an overseas survey tool. Ask your team how things are really going, and keep every response hosted here."
        checklist={[
          "Responses are not linked back to a person",
          "1 to 5 ratings across a few statements, plus a comment box",
          "No overseas processing of your staff data",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="Our workload is manageable most weeks."
            meta="Anonymous · agree to disagree"
            options={[
              { label: "Agree", pct: 38 },
              { label: "Neutral", pct: 29 },
              { label: "Disagree", pct: 33 },
            ]}
            footer="Anonymous · 1 to 5 across five statements"
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Client & patient satisfaction"
        title="A quick rating on the way out"
        body="Stand a QR code on the front desk and let clients or patients rate the visit before they leave. It takes one tap, no sign-in, and you build a record you can review each month."
        checklist={[
          "QR code, link or six-character code",
          "1 to 5 rating with one optional comment",
          "No account needed to respond",
        ]}
        visual={<DeskRating />}
      />

      {/* CLAIM-FLAG (verified-voting): one-link-per-member verified voting is
          target-state; confirm before publishing. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Partner & board decisions"
        title="A clean vote on the decisions that matter"
        body="Send each partner or board member their own private link for the decisions that need a clear count. Everyone gets one vote, and you finish with a record for the file rather than a thread of replies."
        checklist={[
          "One private link per partner or director",
          "Yes, no and abstain, with an optional close time",
          "A results record with the question, counts and times",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Approve the new premises lease?"
            meta="Partners · closes Friday 5pm"
            code="BRD31"
            options={[
              { label: "Yes", pct: 71 },
              { label: "No", pct: 21 },
              { label: "Abstain", pct: 8 },
            ]}
            footer="Verified vote · one link per partner"
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Dates & logistics"
        title="Pick a training or offsite date without the reply-all"
        body="Post the dates for the training day or the team offsite and let people tick every one that works. You choose with the whole picture in front of you, not the loudest three replies."
        checklist={[
          "Multi-select date polls",
          "See who has and hasn't responded",
          "Share a link or a QR code in the staff room",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Which Friday suits for the team offsite?"
            meta="Tick every date you can make"
            options={[
              { label: "7 March", pct: 34 },
              { label: "14 March", pct: 58 },
              { label: "21 March", pct: 41 },
            ]}
            footer="Multi-select · 22 responses"
          />
        }
      />

      <PricingTeaser
        sub="Start free, then upgrade when you run anonymous or verified polls."
        proDescription="Anonymous and verified voting, the results record and no TheJury branding on the poll."
      />

      <CtaBand
        accent={ACCENT}
        title="Ask your team the question you've been putting off"
        body="Write it, share a link, and read the answers without a name attached. Your data stays hosted in Australia the whole way."
        cta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
      />
    </div>
  );
}
