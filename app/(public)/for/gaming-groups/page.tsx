import type { Metadata } from "next";
import { UseCaseHero } from "@/components/design/useCase/UseCaseHero";
import { FeatureRow } from "@/components/design/useCase/FeatureRow";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";
import { DISCORD_INSTALL_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "D&D session scheduling poll & Discord scheduling poll | TheJury",
  description:
    "Run a D&D session scheduling poll or a Discord scheduling poll: post the Fridays, let the party tick what works, and lock the night in with ranked-choice game picks.",
  alternates: { canonical: "/for/gaming-groups" },
  openGraph: {
    title: "D&D & Discord session scheduling polls | TheJury",
    description:
      "Find a night everyone can make. A scheduling poll your party votes on straight from Discord.",
    url: "/for/gaming-groups",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for Gaming Groups",
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "Web, Discord",
  description:
    "A D&D session scheduling poll and Discord scheduling poll tool: date-availability polls and ranked-choice game picks your party votes on in one tap.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

const ACCENT = "gaming" as const;

/* ── Visuals ────────────────────────────────────────────────── */

function HeroDatePoll() {
  const rows = [
    { d: "Fri 19 Sep", n: 6, lead: true },
    { d: "Fri 26 Sep", n: 4 },
    { d: "Fri 3 Oct", n: 3 },
    { d: "Fri 10 Oct", n: 1 },
  ];
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gaming/[0.16] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-gaming-text">
          <span className="h-1.5 w-1.5 rounded-full bg-gaming animate-pulse" />
          Live
        </span>
        <span className="text-[12px] text-jury-dim">6 of 6 replied</span>
      </div>
      <h3 className="text-[17px] font-semibold text-jury-text">
        Which Fridays work for Episode 12?
      </h3>
      <p className="mt-1 text-[13px] text-jury-dim">Tick every date you can make</p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.d}
            className="relative overflow-hidden rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0"
              style={{ width: `${(r.n / 6) * 100}%`, background: "rgba(167,155,234,0.16)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] text-jury-body">
                {r.d}
                {r.lead && (
                  <span className="rounded-full bg-gaming/[0.16] px-2 py-0.5 text-[10px] font-semibold text-gaming-text">
                    all 6 free
                  </span>
                )}
              </span>
              <span className="text-[13px] font-semibold text-jury-text">{r.n}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-jury-border-subtle pt-3">
        <span className="text-[12px] text-jury-dim">
          Winner locks automatically at 6 votes
        </span>
        <span className="rounded-full bg-gaming px-3 py-1 text-[12px] font-semibold text-gaming-on">
          Lock it in
        </span>
      </div>
    </div>
  );
}

function WhosIn() {
  const people = ["Kessa", "Thorax", "Calypso", "Mira", "Dain", "Rue (DM)"];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <p className="mb-4 text-[13px] font-semibold text-jury-muted">
        Who&apos;s in — Fri 19 Sep
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {people.map((p) => (
          <div
            key={p}
            className="flex items-center gap-2.5 rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gaming/[0.16] text-[13px] font-semibold text-gaming-text">
              {p.charAt(0)}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-jury-emerald text-[8px] text-jury-on-emerald">
                ✓
              </span>
            </span>
            <span className="text-[13px] text-jury-body">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedList() {
  const rows = [
    { r: 1, label: "Curse of Strahd", score: 24 },
    { r: 2, label: "Blades in the Dark", score: 18 },
    { r: 3, label: "Delta Green one-shot", score: 11 },
    { r: 4, label: "Terraria co-op", score: 7 },
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-jury-muted">
          What are we playing next?
        </p>
        <span className="rounded-full bg-gaming/[0.16] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-gaming-text">
          Ranked choice
        </span>
      </div>
      <p className="mb-4 text-[12px] text-jury-dim">
        Drag to rank — first preferences count double
      </p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.r}
            className="flex items-center gap-3 rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gaming/[0.16] text-[12px] font-semibold text-gaming-text">
              {row.r}
            </span>
            <span className="flex-1 text-[14px] text-jury-body">{row.label}</span>
            <span className="text-[12px] text-jury-dim">score {row.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscordMock() {
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-5">
      <p className="mb-3 font-mono text-[13px] text-jury-dim">#party-planning</p>
      <div className="mb-3 flex gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gaming/[0.16] text-[12px] font-semibold text-gaming-text">
          R
        </span>
        <div className="text-[13px]">
          <p className="text-jury-dim">
            <span className="font-semibold text-jury-body">rue</span> today at 8:14 pm
          </p>
          <p className="mt-0.5 font-mono text-jury-body">
            /jury create question: Session 12 — which Friday?
          </p>
        </div>
      </div>
      <div className="rounded-[10px] border border-jury-border bg-jury-input p-3.5 pl-4 shadow-[inset_3px_0_0_0_#10B981]">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-jury-emerald text-[10px] font-bold text-jury-on-emerald">
            TJ
          </span>
          <span className="text-[13px] font-semibold text-jury-text">
            Session 12 — which Friday?
          </span>
        </div>
        {[
          { d: "Fri 19 Sep", n: 6 },
          { d: "Fri 26 Sep", n: 4 },
        ].map((v) => (
          <div
            key={v.d}
            className="mt-1.5 flex items-center justify-between rounded-lg border border-jury-border bg-jury-surface px-3 py-2 text-[13px]"
          >
            <span className="text-jury-body">{v.d}</span>
            <span className="font-semibold text-jury-text">{v.n}</span>
          </div>
        ))}
        <p className="mt-2.5 text-[11px] text-jury-dim">
          Tap an option to vote · powered by TheJury
        </p>
      </div>
    </div>
  );
}

function CampaignLog() {
  const rows = [
    ["Next session", "Fri 19 Sep"],
    ["Campaign", "Curse of Strahd"],
    ["Side quest first?", "Yes · 4–2"],
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-jury-muted">
          Tabletop Chronicles
        </span>
        <span className="rounded-full border border-gaming/40 bg-gaming/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gaming-text">
          Integration · Soon
        </span>
      </div>
      <p className="text-[15px] font-semibold text-jury-text">The Ashfall Company</p>
      <p className="text-[12px] text-jury-dim">Campaign page · Session 12</p>
      <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-jury-dim">
        Party decisions
      </p>
      <div className="divide-y divide-jury-border-subtle rounded-[10px] border border-jury-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
            <span className="text-jury-muted">{k}</span>
            <span className="font-medium text-jury-body">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GamingGroupsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UseCaseHero
        accent={ACCENT}
        eyebrow="For D&D parties & Discord servers"
        title="Find a night everyone can make."
        lead="Stop scrolling back through 200 messages to work out who's free. Post the dates, let the party tick what works, and lock the session in."
        primaryCta={{ label: "Add to Discord", href: DISCORD_INSTALL_URL, external: true }}
        secondaryCta={{ label: "Create a poll", href: "/create" }}
        visual={<HeroDatePoll />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Schedule a session"
        title="Dates as options, availability as results"
        body="Multi-select is on by default, so everyone ticks all the nights they can make. The option with the most greens wins — and you can see exactly who's missing before you commit."
        checklist={[
          "Recurring weekly poll, posted automatically",
          "Reminder ping for anyone who hasn't voted",
          "Calendar invite generated from the winning date",
        ]}
        visual={<WhosIn />}
      />

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Decide what to play"
        title="Ranked choice ends the stalemate"
        body="Four people, four favourite systems, nobody budging. Ranked choice takes second preferences into account, so the group lands on the campaign most people are genuinely happy to run — not the one the loudest player shouted for."
        visual={<RankedList />}
      />

      <div id="discord">
        <FeatureRow
          accent={ACCENT}
          eyebrow="Quick vote in Discord"
          title="Never leave the server"
          body="Type /jury create and the poll appears in the channel as a card people can vote on in one tap. Results update in place — no bot spam, no thread of reaction emoji to count."
          visual={<DiscordMock />}
        />
      </div>

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Results in your campaign page"
        title="Every vote, on the record"
        body="Connect TheJury to Tabletop Chronicles and each poll result is pinned to the campaign — who voted for the ambush, when the party chose to burn the tower, which Friday you actually played. A decision log you didn't have to write."
        checklist={["Join the integration waitlist →"]}
        visual={<CampaignLog />}
      />

      <PricingTeaser
        sub="Most gaming groups never leave the free tier."
        proDescription={`Unlimited polls, ranked choice, scheduling. Lifetime A$199.`}
      />

      <CtaBand
        accent={ACCENT}
        title="Get the party on the same night"
        body="Add the bot to your server, post one poll, and have Session 12 in the calendar before anyone rolls initiative on the group chat."
        cta={{ label: "Add to Discord", href: DISCORD_INSTALL_URL, external: true }}
        secondaryCta={{ label: "Create a poll", href: "/create" }}
      />
    </>
  );
}
