"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PollResultCard } from "@/components/design/PollResultCard";

/**
 * The auth left panel: wordmark, a settled live-poll card and one line of
 * copy that differs between login and signup. Emerald-tinted grid on #07110F.
 */
export function AuthPanel() {
  const pathname = usePathname();
  const isSignup = pathname?.includes("/sign-up");

  const copy = isSignup
    ? "Unlimited polls, unlimited votes, no card — that's the free tier, forever."
    : "This is a real poll someone settled in four minutes — yours takes about the same.";

  return (
    <div
      className="relative hidden flex-col justify-between p-14 lg:flex lg:w-1/2"
      style={{
        background: "#07110F",
        backgroundImage:
          "linear-gradient(rgba(16,185,129,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Link href="/" className="font-display text-3xl text-jury-text hover:text-jury-emerald-hi">
        TheJury
      </Link>

      <div className="max-w-[420px]">
        <PollResultCard
          question="Where are we doing Friday drinks?"
          meta="24 votes · settled in 4 minutes"
          live={false}
          footer="Decided · results locked"
          options={[
            { label: "The Alehouse", pct: 58 },
            { label: "Rooftop bar", pct: 24 },
            { label: "Order in, stay put", pct: 12 },
            { label: "Skip it this week", pct: 6 },
          ]}
        />
        <p className="mt-6 text-[18px] font-light leading-relaxed text-jury-muted">
          {copy}
        </p>
      </div>

      <p className="text-[13px] text-jury-faint">© {new Date().getFullYear()} TheJury</p>
    </div>
  );
}
