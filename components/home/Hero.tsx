import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DemoPollWidget from "@/components/DemoPollWidget";

/**
 * Homepage hero. Static headline (no rotating-word effect), a live demo poll on
 * the right that any visitor can vote in. If the demo poll can't load, the
 * widget hides itself rather than showing an empty "Loading" state.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-jury-base grid-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-20 sm:px-14 lg:grid-cols-[1fr_480px] lg:gap-[72px] lg:pb-24 lg:pt-[88px]">
        {/* Left — copy */}
        <div>
          <span className="inline-flex rounded-full border border-jury-emerald-line bg-jury-emerald-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-jury-emerald sm:text-[12px]">
            Australian-hosted · No account needed to vote
          </span>
          <h1 className="mt-5 text-pretty font-display text-[36px] leading-[1.08] text-jury-text sm:text-[62px]">
            Polls and votes your organisation can actually use
          </h1>
          <p className="mt-5 max-w-[520px] text-pretty text-[15px] font-light leading-relaxed text-jury-muted sm:text-[19px]">
            Anonymous staff feedback, AGM motions, community consultation and
            live session polls. Hosted in Australia, with a results record you
            can attach to the minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-jury-emerald px-6 text-[15px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
            >
              Create a poll
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link
              href="#live-poll"
              className="inline-flex h-11 items-center justify-center rounded-full border border-jury-border-strong px-6 text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              See a live poll
            </Link>
          </div>
        </div>

        {/* Right — live poll */}
        <div id="live-poll" className="scroll-mt-24 lg:pl-4">
          <DemoPollWidget />
        </div>
      </div>
    </section>
  );
}
