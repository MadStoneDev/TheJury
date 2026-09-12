import Link from "next/link";
import type { Accent } from "./IconTile";

const WASH: Record<Accent, string> = {
  emerald: "rgba(16,185,129,0.10)",
  gaming: "rgba(167,155,234,0.10)",
  teams: "rgba(143,176,232,0.10)",
  creators: "rgba(224,179,132,0.10)",
};

const FILL: Record<Accent, string> = {
  emerald: "bg-jury-emerald text-jury-on-emerald hover:bg-jury-emerald-hi",
  gaming: "bg-gaming text-gaming-on hover:brightness-110",
  teams: "bg-teams text-teams-on hover:brightness-110",
  creators: "bg-creators text-creators-on hover:brightness-110",
};

interface Cta {
  label: string;
  href: string;
  external?: boolean;
}

const extProps = (cta: Cta) =>
  cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

interface CtaBandProps {
  title: string;
  body: string;
  cta: Cta;
  secondaryCta?: Cta;
  accent?: Accent;
}

/**
 * The final call-to-action band — a radial accent wash, one headline, one
 * sentence and a filled button. Always has content (never an empty band).
 */
export function CtaBand({
  title,
  body,
  cta,
  secondaryCta,
  accent = "emerald",
}: CtaBandProps) {
  return (
    <section className="relative overflow-hidden border-t border-jury-border-subtle bg-jury-base">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(700px 240px at 50% 0%, ${WASH[accent]}, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-[78px] text-center sm:px-8">
        <h2 className="font-display text-3xl leading-[1.1] text-jury-text sm:text-[42px]">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-jury-muted sm:text-[17px]">
          {body}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={cta.href}
            {...extProps(cta)}
            className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-semibold transition ${FILL[accent]}`}
          >
            {cta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              {...extProps(secondaryCta)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-jury-border-strong px-6 text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
