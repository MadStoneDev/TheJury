"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconScale, IconUsers } from "@tabler/icons-react";
import DemoPollWidget from "@/components/DemoPollWidget";
import { Button } from "@/components/ui/button";
import { roundStat, type LandingStats } from "@/lib/landingStats";

// Each rotating word links to the use-case page it belongs to.
const WORDS: { word: string; href: string }[] = [
  { word: "friends", href: "/for/gaming-groups" },
  { word: "family", href: "/for/gaming-groups" },
  { word: "colleagues", href: "/for/teams" },
  { word: "team", href: "/for/teams" },
  { word: "community", href: "/for/gaming-groups" },
  { word: "audience", href: "/for/creators" },
];

function AnimatedWord() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Reserve width using the longest word so the layout doesn't jump.
  const longestWord = WORDS.reduce(
    (a, b) => (a.word.length > b.word.length ? a : b),
    WORDS[0],
  ).word;

  const current = WORDS[index];
  const linkClass = "gradient-text whitespace-nowrap hover:underline";

  return (
    <span className="inline-block relative h-[1.2em] overflow-hidden align-bottom">
      {/* Invisible longest word to reserve width */}
      <span className="invisible whitespace-nowrap">{longestWord}</span>
      {reduceMotion ? (
        // Respect prefers-reduced-motion: rotate the word but no slide/fade.
        <Link
          href={current.href}
          className={`absolute left-0 top-0 ${linkClass}`}
        >
          {current.word}
        </Link>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={current.word}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute left-0 top-0"
          >
            <Link href={current.href} className={linkClass}>
              {current.word}
            </Link>
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

export default function Hero({ stats }: { stats: LandingStats }) {
  const reduceMotion = useReducedMotion();
  const copyAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6 },
      };
  const demoAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, delay: 0.2 },
      };

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-10 dark:opacity-20" />
      <div className="absolute inset-0 grid-bg" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <motion.div {...copyAnim} className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-[1.1] text-foreground">
                Let your <AnimatedWord />
                <br />
                <span className="gradient-text">decide</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Finally, a poll creator that gets straight to the point. Create
                polls in seconds, share with your people, and get answers fast.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/create">
                <Button variant="brand" size="xl" className="gap-2">
                  Create Your First Poll
                  <IconArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="brand-outline" size="xl">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust bar — only shown when the real numbers are meaningful */}
            {stats.show && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IconScale className="w-4 h-4 text-emerald-500" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {roundStat(stats.pollCount)}
                    </span>{" "}
                    polls created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4 text-emerald-500" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {roundStat(stats.voteCount)}
                    </span>{" "}
                    votes cast
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right — demo poll */}
          <motion.div {...demoAnim} className="lg:pl-4">
            <div className={reduceMotion ? "" : "animate-float"}>
              <DemoPollWidget />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
