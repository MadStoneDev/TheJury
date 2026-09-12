import Link from "next/link";
import type { ReactNode } from "react";
import type { Accent } from "../IconTile";
import { EYEBROW, FILL_BTN } from "../accents";

interface Cta {
  label: string;
  href: string;
  external?: boolean;
}

const extProps = (cta: Cta) =>
  cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

interface UseCaseHeroProps {
  eyebrow: string;
  title: string;
  lead: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  accent: Accent;
  visual: ReactNode;
}

/** Shared hero for the /for/* use-case pages: copy left, themed visual right. */
export function UseCaseHero({
  eyebrow,
  title,
  lead,
  primaryCta,
  secondaryCta,
  accent,
  visual,
}: UseCaseHeroProps) {
  return (
    <section className="relative overflow-hidden bg-jury-base grid-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-14 lg:grid-cols-[1fr_500px] lg:py-24">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12px] ${EYEBROW[accent]}`}
          >
            {eyebrow}
          </span>
          <h1 className="mt-5 text-pretty font-display text-[36px] leading-[1.08] text-jury-text sm:text-[54px] lg:text-[62px]">
            {title}
          </h1>
          <p className="mt-5 max-w-[520px] text-pretty text-[17px] font-light leading-relaxed text-jury-muted sm:text-[19px]">
            {lead}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCta.href}
              {...extProps(primaryCta)}
              className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-semibold transition ${FILL_BTN[accent]}`}
            >
              {primaryCta.label}
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
        <div className="lg:pl-4">{visual}</div>
      </div>
    </section>
  );
}
