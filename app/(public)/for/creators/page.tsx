import type { Metadata } from "next";
import { UseCaseHero } from "@/components/design/useCase/UseCaseHero";
import { FeatureRow } from "@/components/design/useCase/FeatureRow";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";

export const metadata: Metadata = {
  title: "Stream overlay poll | TheJury",
  description:
    "Run a stream overlay poll: drop a transparent browser-source poll into OBS, let chat vote in one tap, and watch real-time results and reactions update live.",
  alternates: { canonical: "/for/creators" },
  openGraph: {
    title: "Stream overlay poll | TheJury",
    description:
      "Let your audience pick. A stream overlay poll for OBS/Streamlabs with live results and branded themes.",
    url: "/for/creators",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TheJury for Creators",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web, OBS, Streamlabs",
  description:
    "A stream overlay poll tool: transparent browser-source overlays, one-tap reaction polls and real-time results for streamers.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
};

const ACCENT = "creators" as const;

function ChatPoll() {
  const rows = [
    { label: "Run the nightmare difficulty", pct: 47, lead: true },
    { label: "Start the new DLC", pct: 31 },
    { label: "Viewer games hour", pct: 22 },
  ];
  return (
    <div
      className="rounded-xl border border-jury-border bg-jury-surface p-6"
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-creators/[0.16] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-creators-text">
          <span className="h-1.5 w-1.5 rounded-full bg-creators animate-pulse" />
          Live · 1,284
        </span>
        <span className="text-[12px] text-jury-dim">voting closes in 0:42</span>
      </div>
      <h3 className="text-[17px] font-semibold text-jury-text">
        What do we do after this boss?
      </h3>
      <p className="mt-1 text-[13px] text-jury-dim">Chat decides · one vote each</p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="relative overflow-hidden rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
          >
            <div aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${r.pct}%`, background: "rgba(224,179,132,0.16)" }} />
            <div className="relative flex items-center justify-between">
              <span className={`text-[14px] ${r.lead ? "font-semibold text-jury-text" : "text-jury-body"}`}>
                {r.label}
              </span>
              <span className={`text-[13px] font-semibold ${r.lead ? "text-creators-text" : "text-jury-dim"}`}>
                {r.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
        One vote per device
      </p>
    </div>
  );
}

function OverlayFrame() {
  return (
    <div>
      <div
        className="relative aspect-video overflow-hidden rounded-xl border border-jury-border"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg,#111827 0 14px,#0E1521 14px 28px)",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] text-jury-faint">
          stream capture 1920×1080
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#F87171]" />
          LIVE · 4.2K
        </span>
        <div
          className="absolute bottom-3 left-3 w-[62%] max-w-[300px] rounded-[10px] border p-3 backdrop-blur-[6px]"
          style={{ background: "rgba(11,15,25,.92)", borderColor: "rgba(224,179,132,0.5)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-white">
              What do we do after this boss?
            </span>
            <span className="text-[11px] text-creators-text">0:42</span>
          </div>
          {[
            { l: "Nightmare difficulty", p: 47 },
            { l: "New DLC", p: 31 },
            { l: "Viewer games", p: 22 },
          ].map((o) => (
            <div key={o.l} className="mt-1.5 flex justify-between text-[11px]">
              <span className="text-jury-body">{o.l}</span>
              <span className="font-semibold text-creators-text">{o.p}%</span>
            </div>
          ))}
          <p className="mt-2 text-[9px] font-semibold tracking-wide text-jury-dim">
            VOTE AT THEJURY.APP/BOSS
          </p>
        </div>
      </div>
      <code className="mt-3 block rounded-lg bg-jury-input px-3 py-2 font-mono text-[12px] text-creators-text">
        thejury.app/overlay/BOSS?theme=dark
      </code>
    </div>
  );
}

function ReactionTiles() {
  const tiles = [
    { n: 612, label: "Insane", lead: true },
    { n: 318, label: "Clean" },
    { n: 204, label: "Rough" },
    { n: 150, label: "Run it back" },
  ];
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-jury-muted">How was that run?</p>
        <span className="rounded-full bg-creators/[0.16] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-creators-text">
          Reaction poll
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-[10px] border p-3 ${
              t.lead ? "border-creators bg-creators/[0.16]" : "border-jury-border bg-jury-input"
            }`}
          >
            <div className={`text-[22px] font-bold ${t.lead ? "text-creators-text" : "text-jury-text"}`}>
              {t.n}
            </div>
            <div className="text-[12px] text-jury-muted">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-jury-dim">
        1,284 reactions in 42 seconds · no sign-in required
      </p>
    </div>
  );
}

function VpmChart() {
  const bars = [20, 38, 62, 100, 84, 55, 40, 28]; // peak at index 3
  return (
    <div className="rounded-xl border border-jury-border bg-jury-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-jury-muted">Votes per minute</p>
        <span className="text-[13px] font-semibold text-jury-text">1,284</span>
      </div>
      <div className="flex h-32 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${h}%`,
              background: h === 100 ? "#E0B384" : "rgba(224,179,132,0.3)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-jury-dim">
        <span>0:00</span>
        <span className="text-creators-text">peak 0:24 — 410 votes</span>
        <span>0:42</span>
      </div>
    </div>
  );
}

function ThemeEditor() {
  const swatches = ["#E0B384", "#160F0A", "#F8FAFC"];
  return (
    <div className="grid gap-4 rounded-xl border border-jury-border bg-jury-surface p-6 sm:grid-cols-2">
      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-jury-dim">
          Theme
        </p>
        <div className="space-y-2">
          {swatches.map((s) => (
            <div key={s} className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded border border-jury-border" style={{ background: s }} />
              <span className="font-mono text-[12px] text-jury-muted">{s}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-jury-muted">Corner radius 12px</p>
        <div className="mt-1.5 h-1.5 rounded-full bg-jury-input">
          <div className="h-full w-1/4 rounded-full bg-creators" />
        </div>
        <p className="mt-4 text-[12px] text-jury-muted">Logo</p>
        <div className="mt-1.5 rounded-[10px] border border-dashed border-jury-border-strong px-3 py-2 text-[12px] text-jury-dim">
          channel-logo.png
        </div>
      </div>
      <div>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-jury-dim">
          Live preview
        </p>
        <div className="rounded-[10px] p-4" style={{ background: "#160F0A", border: "1px solid rgba(224,179,132,0.5)" }}>
          <p className="text-[11px] font-bold tracking-wide" style={{ color: "#E0B384" }}>
            NORTHWIND
          </p>
          <p className="mt-1 text-[14px] font-semibold" style={{ color: "#F8FAFC" }}>
            Pick tonight&apos;s map
          </p>
          {[
            { l: "Ashcroft", p: 58 },
            { l: "Dunes", p: 42 },
          ].map((o) => (
            <div key={o.l} className="mt-2 flex justify-between text-[12px]" style={{ color: "#F8FAFC" }}>
              <span>{o.l}</span>
              <span style={{ color: "#E0B384" }}>{o.p}%</span>
            </div>
          ))}
          <div className="mt-3 rounded-full py-1.5 text-center text-[12px] font-semibold" style={{ background: "#E0B384", color: "#160F0A" }}>
            Vote
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UseCaseHero
        accent={ACCENT}
        eyebrow="For streamers & communities"
        title="Let your audience pick."
        lead="Put a poll on the overlay, read the room in ten seconds, and let chat steer the next hour. No extension to install, no counting emoji by hand."
        primaryCta={{ label: "Create a poll", href: "/create" }}
        secondaryCta={{ label: "See the overlay", href: "#overlay" }}
        visual={<ChatPoll />}
      />

      <div id="overlay">
        <FeatureRow
          accent={ACCENT}
          eyebrow="Stream overlay embed"
          title="A browser source and you're live"
          body="Paste the overlay URL into OBS or Streamlabs as a browser source. Transparent background, positioned wherever you like, and it disappears on its own when the poll closes."
          visual={<OverlayFrame />}
        />
      </div>

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Reaction polls"
        title="One tap, thousands of answers"
        body="Reaction polls are built for scale: four short options, one tap, no account. Fire one off after a run, a reveal or a take and you get a read on the whole audience — not just the six people fast enough to type."
        visual={<ReactionTiles />}
      />

      <FeatureRow
        accent={ACCENT}
        eyebrow="Real-time results"
        title="Watch the room change its mind"
        body="Bars move as votes land, so you can narrate the swing live. Open the results page on a second screen for the full picture: votes per minute, the moment an option overtook another, and the final split to screenshot for the clip."
        visual={<VpmChart />}
      />

      <FeatureRow
        accent={ACCENT}
        altBg
        reverse
        eyebrow="Branded embed theme"
        title="It should look like your channel"
        body="Set your colours, corner radius, font and logo once and every poll — overlay, embed or shared link — comes out on brand. Pro removes the TheJury mark entirely."
        checklist={["See theme options →"]}
        visual={<ThemeEditor />}
      />

      <PricingTeaser
        sub="Overlays and branding live on Pro."
        proDescription={`Overlays, reactions, branded themes. Lifetime A$199.`}
      />

      <CtaBand
        accent={ACCENT}
        title="Give chat the wheel"
        body="Set up a poll between scenes and let the audience pick what happens next — the overlay is running before your next segment starts."
        cta={{ label: "Create a poll", href: "/create" }}
      />
    </>
  );
}
