import type { Accent } from "./IconTile";

const FILL: Record<Accent, string> = {
  emerald: "rgba(16,185,129,0.14)",
  churches: "rgba(224,179,132,0.16)",
  clubs: "rgba(143,176,232,0.16)",
  councils: "rgba(127,190,181,0.16)",
  businesses: "rgba(167,155,234,0.16)",
  presenters: "rgba(231,154,174,0.16)",
  gaming: "rgba(167,155,234,0.16)",
  teams: "rgba(143,176,232,0.16)",
  creators: "rgba(224,179,132,0.16)",
};

const LEADER_TEXT: Record<Accent, string> = {
  emerald: "text-jury-emerald-hi",
  churches: "text-churches-text",
  clubs: "text-clubs-text",
  councils: "text-councils-text",
  businesses: "text-businesses-text",
  presenters: "text-presenters-text",
  gaming: "text-gaming-text",
  teams: "text-teams-text",
  creators: "text-creators-text",
};

export interface PollOption {
  label: string;
  pct: number;
}

interface PollResultCardProps {
  question: string;
  options: PollOption[];
  code?: string;
  meta?: string;
  footer?: string;
  live?: boolean;
  accent?: Accent;
  className?: string;
}

/**
 * Presentational live-poll result card — the redesign's signature visual, used
 * on the hero, the auth left panel and the use-case pages. Static/props-driven;
 * the interactive hero widget composes real data into the same look.
 */
export function PollResultCard({
  question,
  options,
  code,
  meta,
  footer = "Updating in real time",
  live = true,
  accent = "emerald",
  className = "",
}: PollResultCardProps) {
  const leaderPct = Math.max(...options.map((o) => o.pct), 0);

  return (
    <div
      className={`rounded-xl border border-jury-border bg-jury-surface p-6 ${className}`}
      style={{ boxShadow: "0 30px 70px -30px rgba(0,0,0,.9)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-jury-emerald-tint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-jury-emerald-hi">
            <span className="h-1.5 w-1.5 rounded-full bg-jury-emerald animate-pulse" />
            Live
          </span>
        )}
        {code && (
          <span className="rounded-md bg-jury-input px-2 py-1 font-mono text-[12px] text-jury-dim">
            Code {code}
          </span>
        )}
      </div>

      <h3 className="text-[17px] font-semibold text-jury-text">{question}</h3>
      {meta && <p className="mt-1 text-[13px] text-jury-dim">{meta}</p>}

      <div className="mt-4 space-y-2.5">
        {options.map((opt) => {
          const isLeader = opt.pct === leaderPct;
          return (
            <div
              key={opt.label}
              className="relative overflow-hidden rounded-[10px] border border-jury-border bg-jury-input px-3 py-2.5"
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-[10px]"
                style={{ width: `${opt.pct}%`, background: FILL[accent] }}
              />
              <div className="relative flex items-center justify-between">
                <span
                  className={`text-[14px] ${
                    isLeader
                      ? "font-semibold text-jury-text"
                      : "text-jury-body"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`text-[13px] font-semibold ${
                    isLeader ? LEADER_TEXT[accent] : "text-jury-dim"
                  }`}
                >
                  {opt.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {footer && (
        <p className="mt-4 border-t border-jury-border-subtle pt-3 text-[12px] text-jury-dim">
          {footer}
        </p>
      )}
    </div>
  );
}
