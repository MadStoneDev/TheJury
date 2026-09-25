import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Download,
  BarChart3,
  Lock,
  Smartphone,
} from "lucide-react";
import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import { IconTile } from "@/components/design/IconTile";
import { ACCENT_TEXT } from "@/components/design/accents";
import { AUDIENCES } from "@/lib/marketing/audiences";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { ComparisonStrip } from "@/components/design/ComparisonStrip";
import { CtaBand } from "@/components/design/CtaBand";

// CLAIM-FLAG: the feature grid and step 2/3 below describe server-enforced
// anonymous voting, verified one-link-per-member voting and a downloadable PDF
// results record. CSV export exists today; the others are target-state — confirm
// before publishing. See /security and lib/marketing/audiences.ts.

export const metadata: Metadata = {
  title: "TheJury — Australian-hosted polls and votes for organisations",
  description:
    "Anonymous staff feedback, AGM motions, community consultation and live session polls. Hosted in Australia, with a results record you can attach to the minutes. No account needed to vote.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: "01",
    title: "Write the question",
    body: "Type it, or start from a template. Multiple choice, ranked, rating or reactions.",
  },
  {
    n: "02",
    title: "Share it",
    body: "A link, a QR code or a six-character code. Or send each member their own private link for a verified vote. Voters never need an account.",
  },
  {
    n: "03",
    title: "Watch it land",
    body: "Results update live. When you're done, download the record as a PDF or CSV for the minutes.",
  },
];

const features: { icon: typeof MapPin; title: string; body: string }[] = [
  {
    icon: MapPin,
    title: "Australian hosting",
    body: "Your polls, votes and member data are hosted in Australia. No overseas processing.",
  },
  {
    icon: ShieldCheck,
    title: "Anonymous or verified voting",
    body: "Keep responses anonymous, or send one private link per member for an election or motion.",
  },
  {
    icon: Download,
    title: "Results record",
    body: "Download a PDF or CSV with the question, options, eligible voters, counts and open and close times.",
  },
  {
    icon: BarChart3,
    title: "Live results for the room",
    body: "Bar, pie or donut, updating the moment a vote lands.",
  },
  {
    icon: Lock,
    title: "Private polls",
    body: "Password protection, time limits and member lists.",
  },
  {
    icon: Smartphone,
    title: "Works on any phone",
    body: "No app to install, and no account needed to vote.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-jury-base">
      <Hero />

      {/* Who uses TheJury */}
      <section className="border-t border-jury-border-subtle bg-jury-base">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-14 lg:py-[72px]">
          <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
            Who uses TheJury
          </h2>
          <p className="mt-2 text-[15px] text-jury-muted sm:text-[17px]">
            Organisations that can&apos;t put member or staff data in overseas
            tools.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => (
              <Link
                key={a.slug}
                href={`/for/${a.slug}`}
                className="group rounded-xl border border-jury-border bg-jury-surface p-6 transition hover:border-white/[0.12]"
              >
                <IconTile icon={a.icon} accent={a.accent} />
                <h3 className="mt-4 text-[19px] font-semibold text-jury-text">
                  {a.cardTitle}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-jury-muted">
                  {a.cardBody}
                </p>
                <span
                  className={`mt-4 inline-block text-[14px] font-medium ${ACCENT_TEXT[a.accent]}`}
                >
                  {a.cardLink}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-jury-border-subtle bg-jury-alt"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-14 lg:py-[72px]">
          <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
            How it works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((s) => (
              <div key={s.n} className="border-l border-jury-border-subtle pl-5">
                <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-jury-emerald">
                  Step {s.n}
                </div>
                <h3 className="mt-3 text-[20px] font-semibold text-jury-text">
                  {s.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-jury-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-jury-border-subtle bg-jury-base">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-14 lg:py-[72px]">
          <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
            What you get
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-jury-border bg-jury-surface p-5 sm:p-6"
              >
                <IconTile
                  icon={f.icon}
                  className="h-[38px] w-[38px]"
                  iconSize={19}
                />
                <h3 className="mt-4 text-[14px] font-semibold text-jury-text sm:text-[17px]">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-jury-muted sm:text-[15px]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparisonStrip />

      <PricingTeaser />

      <CtaBand
        title="Put it to a vote"
        body="Write the question, share a link or a code, and finish with a record you can keep. Your data stays in Australia."
        cta={{ label: "Create a poll", href: "/create" }}
      />
    </div>
  );
}
