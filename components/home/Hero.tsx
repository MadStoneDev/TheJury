"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import DemoPollWidget from "@/components/DemoPollWidget";

// Hero rotating word → its /for page. Order per the design.
const WORDS: { word: string; href: string }[] = [
  { word: "team", href: "/for/teams" },
  { word: "friends", href: "/for/gaming-groups" },
  { word: "family", href: "/for/gaming-groups" },
  { word: "community", href: "/for/gaming-groups" },
];

function RotatingWord() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (reduce) return; // Respect prefers-reduced-motion: no rotation.
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 1800);
    return () => clearInterval(t);
  }, [reduce]);

  const longest = WORDS.reduce((a, b) =>
    a.word.length > b.word.length ? a : b,
  ).word;
  const cur = WORDS[i];

  return (
    <span className="relative inline-block h-[1.05em] overflow-hidden align-bottom">
      <span className="invisible whitespace-nowrap">{longest}</span>
      {reduce ? (
        <Link
          href={cur.href}
          className="absolute left-0 top-0 whitespace-nowrap text-jury-emerald hover:text-jury-emerald-hi"
        >
          {cur.word}
        </Link>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={cur.word}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute left-0 top-0 whitespace-nowrap"
          >
            <Link
              href={cur.href}
              className="text-jury-emerald hover:text-jury-emerald-hi"
            >
              {cur.word}
            </Link>
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-jury-base grid-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-20 sm:px-14 lg:grid-cols-[1fr_480px] lg:gap-[72px] lg:pb-24 lg:pt-[88px]">
        {/* Left — copy */}
        <div>
          <span className="inline-flex rounded-full border border-jury-emerald-line bg-jury-emerald-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-jury-emerald sm:text-[12px]">
            Free to start · no account needed to vote
          </span>
          <h1 className="mt-5 text-pretty font-display text-[36px] leading-[1.08] text-jury-text sm:text-[62px]">
            Let your <RotatingWord /> decide
          </h1>
          <p className="mt-5 max-w-[520px] text-pretty text-[15px] font-light leading-relaxed text-jury-muted sm:text-[19px]">
            Make a poll in fifteen seconds, share a link or a code, and watch the
            answers land live. Ranked choice, ratings, reactions — no
            spreadsheets, no group-chat chaos.
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
              href="#how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-full border border-jury-border-strong px-6 text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              See a live example
            </Link>
          </div>
        </div>

        {/* Right — live poll */}
        <div className="lg:pl-4">
          <DemoPollWidget />
        </div>
      </div>
    </section>
  );
}
