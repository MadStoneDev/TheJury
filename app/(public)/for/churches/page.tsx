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

const ACCENT = "churches" as const;

export const metadata: Metadata = {
  title: "Church voting online | TheJury",
  description:
    "Church voting online, hosted in Australia. Run a congregational vote with one private link per member, choose service times, and download a results record for the minutes.",
  alternates: { canonical: "/for/churches" },
  openGraph: {
    title: "Church voting online | TheJury",
    description:
      "Congregational votes, service-time polls and anonymous feedback, hosted in Australia. A results record you can attach to the minutes.",
    url: "/for/churches",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for churches",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Australian-hosted voting for churches and ministries: congregational votes with one link per member, service-time polls, anonymous ministry-team feedback and a downloadable results record.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

/** Mock: verified voting — one private link per member on the roll. */
function VerifiedRoll() {
  const members = [
    { name: "Karen Nguyen", voted: true },
    { name: "Dave Mitchell", voted: true },
    { name: "Priya Sharma", voted: false },
    { name: "Tom Kelly", voted: true },
    { name: "Fiona Papadopoulos", voted: false },
  ];
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-jury-text">
          Members on the roll
        </h3>
        <span className="rounded-md bg-jury-input px-2 py-1 text-[12px] text-jury-dim">
          3 of 5 voted
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {members.map((m) => (
          <li
            key={m.name}
            className="flex items-center justify-between rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <span className="text-[14px] text-jury-body">{m.name}</span>
            <span
              className={`text-[12px] font-medium ${
                m.voted ? "text-churches-text" : "text-jury-dim"
              }`}
            >
              {m.voted ? "Voted" : "Link sent"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        Each member gets one private link. One vote each, and the roll stays with
        you.
      </p>
    </div>
  );
}

export default function ChurchesPage() {
  return (
    <div className="bg-jury-base">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UseCaseHero
        accent={ACCENT}
        eyebrow="For churches & ministries"
        title="Put it to the congregation."
        lead="Run a congregational vote, choose a service time, or ask the ministry team what they really think. Hosted in Australia, with a results record you can attach to the minutes."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Adopt the building extension proposal?"
            meta="Members' meeting · 18 June"
            code="VOTE24"
            options={[
              { label: "Yes", pct: 68 },
              { label: "No", pct: 22 },
              { label: "Abstain", pct: 10 },
            ]}
            footer="Verified vote · one link per member on the roll"
          />
        }
      />

      {/* CLAIM-FLAG (verified-voting): one-link-per-member verified voting is
          target-state; confirm before publishing. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Congregational votes"
        title="A vote the meeting can stand behind"
        body="Send each member on the roll their own private link. Everyone gets one vote, nobody has to raise a hand in the room, and you finish with a clear count for the minutes."
        checklist={[
          "One private link per member, one vote each",
          "Yes, no and abstain, or whatever the motion needs",
          "A results record with the question, counts and close time",
        ]}
        visual={<VerifiedRoll />}
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="Service times & dates"
        title="Find a time that suits the most people"
        body="Moving a service, adding a mid-week night, or picking a date for the working bee? Post the options and let people tick every time they can make, so you choose with the whole picture in front of you."
        checklist={[
          "Multi-select date and time polls",
          "No account needed to respond",
          "Share a link, a QR code or a six-character code",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="Which mid-week night works for you?"
            meta="Tick every night you can make"
            options={[
              { label: "Tuesday", pct: 41 },
              { label: "Wednesday", pct: 63 },
              { label: "Thursday", pct: 38 },
            ]}
            footer="Multi-select · 52 responses"
          />
        }
      />

      {/* CLAIM-FLAG (anonymous-voting): server-enforced anonymity is
          target-state; confirm before publishing. See /security. */}
      <FeatureRow
        accent={ACCENT}
        eyebrow="Honest feedback"
        title="Ask the ministry team what they really think"
        body="Anonymous polls make room for the answer people won't give across a table. Ask the elders, the ministry team or the volunteers, and read the numbers without anyone's name attached."
        checklist={[
          "Responses are not linked back to a person",
          "Add a comment box for the things numbers miss",
          "Good for elder, staff and volunteer check-ins",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            live={false}
            question="How supported do you feel in your role?"
            meta="Anonymous · ministry team"
            options={[
              { label: "Well supported", pct: 47 },
              { label: "Mostly", pct: 34 },
              { label: "Stretched thin", pct: 19 },
            ]}
            footer="Anonymous responses · no names recorded"
          />
        }
      />

      <FeatureRow
        accent={ACCENT}
        reverse
        altBg
        eyebrow="In the room"
        title="Live polls for members' meetings and youth nights"
        body="Put a question on the screen and watch the answers land as people vote from their phones. Useful for a quick temperature check at a members' meeting, or a bit of fun on a youth-group night."
        checklist={[
          "Results update live on the screen",
          "Works on any phone, no app to install",
          "Member data stays hosted in Australia",
        ]}
        visual={
          <PollResultCard
            accent={ACCENT}
            question="What should we plan first for next term?"
            meta="Youth group · live"
            code="YTH7"
            options={[
              { label: "Camp weekend", pct: 52 },
              { label: "Service project", pct: 29 },
              { label: "Games night", pct: 19 },
            ]}
          />
        }
      />

      <PricingTeaser
        sub="Most churches start on the free tier and upgrade when they run a real vote."
        proDescription="Anonymous and verified voting, the results record and no TheJury branding on the poll."
      />

      <CtaBand
        accent={ACCENT}
        title="Put it to the congregation"
        body="Write the question, send the links, and finish with a record you can attach to the minutes. Your member data stays in Australia the whole way."
        cta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "How your data is handled", href: "/security" }}
      />
    </div>
  );
}
