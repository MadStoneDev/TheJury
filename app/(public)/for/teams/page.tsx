import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { UseCaseHero } from "@/components/design/useCase/UseCaseHero";
import { FeatureRow } from "@/components/design/useCase/FeatureRow";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";

export const metadata: Metadata = {
  title: "Team decision poll | TheJury",
  description:
    "Run a team decision poll instead of another meeting: lunch and date votes, sprint retro ratings, anonymous feedback and polls embedded right in your wiki.",
  alternates: { canonical: "/for/teams" },
  openGraph: {
    title: "Team decision poll | TheJury",
    description:
      "Decide in the channel, not the meeting. Post the question, set a deadline, read the answer.",
    url: "/for/teams",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for Teams",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A team decision poll tool: deadline-based lunch and date votes, sprint retro ratings, anonymous feedback and embeddable polls.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

const ACCENT = "teams" as const;

function LunchPoll() {
  const rows = [
    { label: "The banh mi place", n: 5 },
    { label: "Dumplings on Swan St", n: 3 },
    { label: "Desk sandwiches, again", n: 1 },
  ];
  const max = 9;
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teams/[0.16] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-teams-text">
          <span className="h-1.5 w-1.5 rounded-full bg-teams animate-pulse" />
          Live
        </span>
        <span className="text-[12px] text-jury-dim">closes 11:30 am</span>
      </div>
      <h3 className="text-[17px] font-semibold text-jury-text">
        Where are we getting lunch?
      </h3>
      <p className="mt-1 text-[13px] text-jury-dim">9 of 11 voted · one choice each</p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="relative overflow-hidden rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0"
              style={{ width: `${(r.n / max) * 100}%`, background: "rgba(143,176,232,0.16)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className={`text-[14px] ${i === 0 ? "font-semibold text-jury-text" : "text-jury-body"}`}>
                {r.label}
              </span>
              <span className="text-[13px] font-semibold text-jury-text">{r.n}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        Anonymous · results visible to all
      </p>
    </div>
  );
}

function DateTiles() {
  const tiles = [
    { d: "Oct 6", n: 4 },
    { d: "Oct 13", n: 9, win: true },
    { d: "Oct 20", n: 6 },
    { d: "Oct 27", n: 2 },
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <p className="mb-4 text-[13px] font-semibold text-jury-muted">Offsite — which week?</p>
      <div className="grid grid-cols-4 gap-2.5">
        {tiles.map((t) => (
          <div
            key={t.d}
            className={`rounded-[10px] border px-2 py-3 text-center ${
              t.win
                ? "border-teams bg-teams/[0.16]"
                : "border-jury-border bg-jury-input"
            }`}
          >
            <div className="text-[13px] font-semibold text-jury-text">{t.d}</div>
            <div className={`mt-1 text-[11px] ${t.win ? "text-teams-text" : "text-jury-dim"}`}>
              {t.n} free
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-jury-dim">
        Week of 13 Oct works for 9 of 11 — closing in 2 hours.
      </p>
    </div>
  );
}

function RetroRatings() {
  const rows = [
    { label: "How was the workload?", v: 2.4 },
    { label: "Clarity of the goal", v: 4.1 },
    { label: "Confidence in the release", v: 3.6 },
    { label: "Would you run this sprint again?", v: 3.9 },
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-jury-muted">Sprint 24 retro</p>
        <span className="rounded-full bg-teams/[0.16] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-teams-text">
          Rating · 1–5
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-jury-body">{r.label}</span>
              <span className="font-semibold text-jury-text">{r.v}</span>
            </div>
            <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-jury-input">
              <div className="h-full rounded-full bg-teams" style={{ width: `${(r.v / 5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-jury-dim">11 responses · compare to Sprint 23 →</p>
    </div>
  );
}

function AnonFeedback() {
  const answers = [
    "Status meetings that could be a poll, honestly.",
    "Re-scoping on the last day of the sprint.",
    "Three approval steps for a copy change.",
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock size={16} strokeWidth={2} className="text-teams" />
        <p className="text-[13px] font-semibold text-jury-muted">
          What should we stop doing?
        </p>
      </div>
      <div className="space-y-2.5">
        {answers.map((a) => (
          <p
            key={a}
            className="rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5 text-[13px] text-jury-body"
          >
            “{a}”
          </p>
        ))}
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        No identities collected · 11 responses
      </p>
    </div>
  );
}

function WikiEmbed() {
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E0B384]" />
        <span className="h-2.5 w-2.5 rounded-full bg-jury-emerald" />
        <span className="ml-2 text-[12px] text-jury-dim">Engineering handbook / Tooling</span>
      </div>
      <p className="text-[13px] leading-relaxed text-jury-muted">
        We&apos;re consolidating on one issue tracker this quarter. Before the
        decision goes to the leads, everyone gets a vote:
      </p>
      <div className="mt-3 rounded-[10px] border border-jury-border bg-jury-input p-3.5">
        <p className="text-[13px] font-semibold text-jury-text">
          Which tracker should we standardise on?
        </p>
        {[
          { label: "Keep the current one", pct: 64, lead: true },
          { label: "Move everything across", pct: 36 },
        ].map((o) => (
          <div
            key={o.label}
            className="relative mt-2 overflow-hidden rounded-lg border border-jury-border bg-jury-surface px-3 py-2"
          >
            <div aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${o.pct}%`, background: "rgba(143,176,232,0.16)" }} />
            <div className="relative flex justify-between text-[13px]">
              <span className={o.lead ? "font-semibold text-jury-text" : "text-jury-body"}>{o.label}</span>
              <span className="font-semibold text-jury-text">{o.pct}%</span>
            </div>
          </div>
        ))}
        <p className="mt-2 text-[11px] text-jury-dim">Embedded poll · powered by TheJury</p>
      </div>
      <code className="mt-3 block rounded-lg bg-jury-input px-3 py-2 font-mono text-[12px] text-teams-text">
        &lt;iframe src=&quot;thejury.app/embed/TRK9x2&quot;&gt;
      </code>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UseCaseHero
        accent={ACCENT}
        eyebrow="For small teams"
        title="Decide in the channel, not the meeting."
        lead="Half the meetings on your calendar are one question with five opinions. Post the question, give it a deadline, and read the answer instead of scheduling the conversation."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "See team templates", href: "/templates" }}
        visual={<LunchPoll />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Lunch & date votes"
        title="The five-minute decisions, in thirty seconds"
        body="Lunch, offsite dates, which demo slot, what to call the release. Set a deadline and the poll closes itself — no chasing, no “bumping this”."
        checklist={[
          "Auto-close on a deadline or a vote count",
          "Multi-select for availability, single for a pick",
          "No account needed — a link is enough",
        ]}
        visual={<DateTiles />}
      />

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Retro polls"
        title="A temperature read before the retro starts"
        body="Send four rating questions the day before. You walk into the retro already knowing where the pain is, and the hour goes on fixing it instead of finding it. Every sprint's numbers sit side by side, so drift is obvious."
        visual={<RetroRatings />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Anonymous feedback"
        title="The answer people won't say out loud"
        body="Turn on anonymity and no name is stored against a response — not for you, not for an admin. Open-ended answers come back as a plain list you can skim in a minute, and the results page tells voters it's anonymous so they believe it."
        visual={<AnonFeedback />}
      />

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Embed in your wiki"
        title="Put the vote where the context is"
        body="Paste one iframe into Notion, Confluence or your docs site and the poll lives inside the page that explains it. People vote while reading the proposal — not three days later when someone remembers the link."
        visual={<WikiEmbed />}
      />

      <PricingTeaser
        sub="Start free. Upgrade when the whole team is in."
        proDescription={`Unlimited polls, anonymous mode, embeds. Lifetime A$199.`}
      />

      <CtaBand
        accent={ACCENT}
        title="Cancel the meeting. Post the poll."
        body="Write the question in the time it takes to find a free half-hour in everyone's calendar, and have the answer before the meeting would have started."
        cta={{ label: "Create a poll", href: "/create" }}
      />
    </>
  );
}
