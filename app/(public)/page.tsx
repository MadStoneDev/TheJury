import Link from "next/link";
import {
  Gamepad2,
  Users,
  Radio,
  Layers,
  BarChart3,
  Code,
  Lock,
  Sparkles,
  Download,
} from "lucide-react";
import Hero from "@/components/home/Hero";
import { IconTile, type Accent } from "@/components/design/IconTile";
import { PricingTeaser } from "@/components/design/PricingTeaser";
import { CtaBand } from "@/components/design/CtaBand";

const audiences: {
  icon: typeof Gamepad2;
  accent: Accent;
  title: string;
  body: string;
  link: string;
  href: string;
}[] = [
  {
    icon: Gamepad2,
    accent: "gaming",
    title: "Gaming groups",
    body: "Find a session night, pick the campaign, vote straight from Discord.",
    link: "For gaming groups →",
    href: "/for/gaming-groups",
  },
  {
    icon: Users,
    accent: "teams",
    title: "Small teams",
    body: "Settle lunch, retros and anonymous feedback without another meeting.",
    link: "For teams →",
    href: "/for/teams",
  },
  {
    icon: Radio,
    accent: "creators",
    title: "Creators",
    body: "Overlay a poll on your stream and let the audience steer the next hour.",
    link: "For creators →",
    href: "/for/creators",
  },
];

const steps = [
  {
    n: "01",
    title: "Write the question",
    body: "Type it, or let AI draft the options for you. Multiple choice, ranked, rating or reactions.",
  },
  {
    n: "02",
    title: "Share the code",
    body: "A link, a QR code, a six-character code or an embed. Voters never need an account.",
  },
  {
    n: "03",
    title: "Watch it land",
    body: "Results update live, chart however you like, and export to CSV when you're done.",
  },
];

const features: { icon: typeof Layers; title: string; body: string }[] = [
  { icon: Layers, title: "Five question types", body: "Choice, rating, ranked choice, image options and reactions." },
  { icon: BarChart3, title: "Live results", body: "Bar, pie or donut, updating the moment a vote lands." },
  { icon: Code, title: "Embed anywhere", body: "Drop a themed iframe into a wiki, site or stream overlay." },
  { icon: Lock, title: "Private polls", body: "Password protection, time limits and anonymous responses." },
  { icon: Sparkles, title: "AI drafting", body: "Describe the decision and get a poll with sensible options." },
  { icon: Download, title: "CSV export", body: "Take every response with you, per question or per voter." },
];

export default function HomePage() {
  return (
    <div className="bg-jury-base">
      <Hero />

      {/* Who it's for */}
      <section className="border-t border-jury-border-subtle bg-jury-base">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-14 lg:py-[72px]">
          <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
            Who it&apos;s for
          </h2>
          <p className="mt-2 text-[15px] text-jury-muted sm:text-[17px]">
            Three ways people use TheJury every week.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {audiences.map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="group rounded-xl border border-jury-border bg-jury-surface p-6 transition hover:border-white/[0.12]"
              >
                <IconTile icon={a.icon} accent={a.accent} />
                <h3 className="mt-4 text-[19px] font-semibold text-jury-text">
                  {a.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-jury-muted">
                  {a.body}
                </p>
                <span
                  className={`mt-4 inline-block text-[14px] font-medium ${
                    a.accent === "gaming"
                      ? "text-gaming-text"
                      : a.accent === "teams"
                        ? "text-teams-text"
                        : "text-creators-text"
                  }`}
                >
                  {a.link}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-jury-border-subtle bg-jury-alt">
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
            Everything in the box
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

      <PricingTeaser />

      <CtaBand
        title={'Stop asking "so what are we doing?"'}
        body="One link, one minute, and the group has actually decided. Your first poll is live before the chat finishes arguing."
        cta={{ label: "Create your first poll", href: "/create" }}
      />
    </div>
  );
}
