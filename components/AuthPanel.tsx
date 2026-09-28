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
    : "A motion, put to the members and settled in minutes — with a record for the minutes.";

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
          question="Motion: adopt the proposed 2027 budget"
          meta="38 of 41 members voted"
          live={false}
          footer="Carried · results locked"
          options={[
            { label: "In favour", pct: 82 },
            { label: "Against", pct: 13 },
            { label: "Abstain", pct: 5 },
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
