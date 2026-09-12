import Link from "next/link";
import { TIERS } from "@/lib/stripe";

interface PricingTeaserProps {
  /** Sub-line under the heading (page-specific on use-case pages). */
  sub?: string;
  /** Pro card description (page-specific on use-case pages). */
  proDescription?: string;
}

/**
 * Compact two-tier pricing teaser used on the homepage and the use-case pages.
 * Prices come from the two-tier config in lib/stripe (Free + Pro, Pro lifetime).
 */
export function PricingTeaser({
  sub = "Start free. Upgrade when your polls outgrow it.",
  proDescription,
}: PricingTeaserProps) {
  const pro = TIERS.pro;
  const proDesc =
    proDescription ??
    `Unlimited polls, every question type, branded embeds. Lifetime A$${pro.priceLifetime}.`;

  return (
    <section className="border-y border-jury-border-subtle bg-jury-alt">
      <div className="mx-auto max-w-6xl px-5 py-[72px] sm:px-14">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
              Simple pricing
            </h2>
            <p className="mt-2 text-[15px] text-jury-muted sm:text-[17px]">{sub}</p>
          </div>
          <Link
            href="/pricing"
            className="text-[15px] font-medium text-jury-emerald hover:text-jury-emerald-hi"
          >
            Compare all features →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-xl border border-jury-border bg-jury-surface p-7">
            <h3 className="text-[17px] font-semibold text-jury-text">Free</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[40px] leading-none text-jury-text">
                A$0
              </span>
              <span className="text-[14px] text-jury-dim">forever</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-jury-muted">
              Unlimited polls &amp; votes, multiple choice + rating, 3 AI drafts a
              month.
            </p>
            <Link
              href="/auth/sign-up"
              className="mt-6 flex h-11 items-center justify-center rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              Get started free
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div
            className="relative rounded-xl border p-7"
            style={{
              borderColor: "rgba(16,185,129,0.45)",
              background: "#0F1520",
              boxShadow:
                "0 0 0 1px rgba(16,185,129,.1), 0 30px 70px -34px rgba(16,185,129,.55)",
            }}
          >
            <span className="absolute -top-3 left-7 rounded-full border border-jury-emerald-line bg-jury-emerald-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-jury-emerald-hi">
              Most Popular
            </span>
            <h3 className="text-[17px] font-semibold text-jury-text">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[40px] leading-none text-jury-emerald-hi">
                A${pro.priceMonthly}
              </span>
              <span className="text-[14px] text-jury-dim">/mo</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-jury-muted">
              {proDesc}
            </p>
            <Link
              href="/pricing"
              className="mt-6 flex h-11 items-center justify-center rounded-full bg-jury-emerald text-[15px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
