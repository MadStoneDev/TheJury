import type { Metadata } from "next";
import { UseCaseHero } from "@/components/design/useCase/UseCaseHero";
import { FeatureRow } from "@/components/design/useCase/FeatureRow";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";
import { PollResultCard } from "@/components/design/PollResultCard";

// NOTE ON CLAIMS: lines marked `CLAIM-FLAG` describe target-state features
// (server-enforced anonymous voting, verified voting, and the Council &
// Enterprise tier) that are not fully built yet. Confirm the implementation
// before this goes live. See lib/marketing/audiences.ts and the /security page.

const ACCENT = "councils" as const;

export const metadata: Metadata = {
  title: "Community consultation polls | TheJury",
  description:
    "Run a community consultation poll that is hosted in Australia. Embed it on the council site or share a QR code at a drop-in session, poll workshops live, and check in with staff anonymously.",
  alternates: { canonical: "/for/councils-and-government" },
  openGraph: {
    title: "Community consultation polls | TheJury",
    description:
      "Australian-hosted community consultation, live workshop polling and anonymous staff pulse checks. No account needed for residents to respond.",
    url: "/for/councils-and-government",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for councils and government",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Australian-hosted polling for councils and government teams: community consultation embedded on the council site or shared by QR code, live workshop and town-hall polling, anonymous staff pulse checks, and a downloadable results record.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

/** Mock: a consultation poll embedded on a council page. */
function EmbeddedConsult() {
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-4"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="flex items-center gap-1.5 border-b border-jury-border-subtle pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-jury-faint" />
        <span className="h-2.5 w-2.5 rounded-full bg-jury-faint" />
        <span className="h-2.5 w-2.5 rounded-full bg-jury-faint" />
        <span className="ml-2 truncate rounded bg-jury-input px-2 py-1 font-mono text-[11px] text-jury-dim">
          council.gov.au/have-your-say
        </span>
      </div>
      <div className="pt-4">
        <PollResultCard
          accent={ACCENT}
          question="Which upgrade should the Main Street budget fund first?"
          meta="Community consultation · closes 30 June"
          options={[
            { label: "Footpath and crossings", pct: 44 },
            { label: "Shade trees and seating", pct: 33 },
            { label: "Bike parking", pct: 23 },
          ]}
          footer="Embedded on the council site · 1,208 responses"
        />
      </div>
    </div>
  );
}

export default function CouncilsAndGovernmentPage() {
  return (
    <div className="bg-jury-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UseCaseHero
        accent={ACCENT}
        eyebrow="For councils & government teams"
        title="Ask the community. Keep the data here."
        lead="Run a community consultation poll that residents can answer without an account, hosted in Australia. Embed it on the council site, share a QR code at a drop-in session, or poll a workshop live."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
        visual={<EmbeddedConsult />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Community consultation"
        title="Consultation residents can actually complete"
        body="Embed the poll on the council website or print a QR code for the drop-in session. Residents respond from any phone with no app and no account, and the results stay hosted in Australia."
        checklist={[
          "Embed on the council site or share a QR code",
          "No account needed for residents to respond",
          "Data hosted in Australia, no overseas processing",
        ]}
        visual={<EmbeddedConsult />}
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Workshops & town halls"
        title="Live polling in the room"
        body="Put a question on the screen at a workshop or town hall and watch the responses land as people vote from their seats. It gives quieter attendees a way to be counted without speaking up."
        checklist={[
          "Results update live on the screen",
          "A six-character code or QR to join",
          "A results record you can add to the report",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Which option best balances cost and access?"
            meta="Planning workshop · live"
            code="TOWN31"
            options={[
              { label: "Option A", pct: 39 },
              { label: "Option B", pct: 46 },
              { label: "Option C", pct: 15 },
            ]}
          />
        }
      />

      {/* CLAIM-FLAG (anonymous-voting): server-enforced anonymity is
          target-state; confirm before publishing. See /security. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Internal staff feedback"
        title="Anonymous staff pulse checks"
        body="Check in with the team without routing staff answers through an overseas survey tool. Responses are not linked back to a person, so people can be straight with you."
        checklist={[
          "Responses are not linked back to a person",
          "Simple 1 to 5 ratings or a short comment",
          "Staff data stays hosted in Australia",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="How manageable is your current workload?"
            meta="Anonymous · staff pulse check"
            options={[
              { label: "Manageable", pct: 41 },
              { label: "Busy but okay", pct: 38 },
              { label: "Overloaded", pct: 21 },
            ]}
            footer="Anonymous responses · no names recorded"
          />
        }
      />

      {/* CLAIM-FLAG (council-tier): pending Phase 3 pricing (Council &
          Enterprise tier, invoice billing, multiple admins). */}
      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="One account, many admins"
        title="Set up for a team, billed by invoice"
        body="Run one organisation account with several admins across departments, rather than polls scattered across personal logins. Invoice billing is available for councils and government teams."
        checklist={[
          "One organisation account, multiple admins",
          "Invoice billing available",
          "A downloadable results record for every poll",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="Departments running polls this quarter"
            meta="One organisation account"
            options={[
              { label: "Community engagement", pct: 42 },
              { label: "Planning", pct: 33 },
              { label: "People & culture", pct: 25 },
            ]}
            footer="Multiple admins · invoice billing available"
          />
        }
      />

      <PricingTeaser
        sub="Start free, or talk to us about invoice billing for a council or government team."
        proDescription="Anonymous and verified voting, the results record, private polls and no TheJury branding."
      />

      <CtaBand
        accent={ACCENT}
        title="Consult the community, keep the record"
        body="Write the question, share the link or QR code, and finish with a results record you can put in the report. The data stays hosted in Australia."
        cta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "Talk to us about pricing", href: "/pricing" }}
      />
    </div>
  );
}
