"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  IconUsers,
  IconCode,
  IconShare,
  IconArrowRight,
  IconScale,
  IconGavel,
  IconClock,
  IconBolt,
} from "@tabler/icons-react";
import DemoPollWidget from "@/components/DemoPollWidget";
import { Button } from "@/components/ui/button";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  HoverCard,
} from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Data ---

const features = [
  {
    icon: IconGavel,
    title: "Ask Your Question",
    description: "Create a poll in under 30 seconds. It's that easy!",
    span: "md:col-span-2",
  },
  {
    icon: IconUsers,
    title: "Get Responses",
    description: "Track votes and responses from one simple dashboard.",
    span: "md:col-span-1",
  },
  {
    icon: IconClock,
    title: "Schedule Polls",
    description: "Set start and end times for time-sensitive polls.",
    span: "md:col-span-1",
  },
  {
    icon: IconCode,
    title: "Embed Anywhere",
    description: "Drop polls into your blog, stream overlay, or team site.",
    span: "md:col-span-1",
  },
  {
    icon: IconShare,
    title: "Share Everywhere",
    description:
      "Discord, WhatsApp, social media, or anywhere you like.",
    span: "md:col-span-1",
  },
  {
    icon: IconBolt,
    title: "Real-Time Results",
    description: "Watch votes come in live as your audience responds.",
    span: "md:col-span-2",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Ask Your Question",
    description:
      "Type your question and add options. Which strategy to use? Planning an event? The power is yours.",
  },
  {
    step: 2,
    title: "Share With People",
    description:
      "Drop the link in group chats, Discord, social media, or embed it on your website.",
  },
  {
    step: 3,
    title: "Get Your Answer",
    description:
      "See the results in real-time from your dashboard. Find out which response won.",
  },
];

const faqs = [
  {
    question: "How quickly can I create a poll?",
    answer:
      "Less than 30 seconds! Just type your question, add some options, and share the link. TheJury has gone back to basics, focusing only on what's most important.",
  },
  {
    question: "Can I schedule when my poll opens and closes?",
    answer:
      "You sure can! When creating your poll, just set a starting and end date. The poll will only be available within that time. You don't even need both dates.",
  },
  {
    question: "How do I share my poll with my friends?",
    answer:
      "Send them the link, share it on social media, drop it in your Discord server, or embed it on your website. TheJury polls work everywhere.",
  },
  {
    question: "Can I watch responses come in real-time?",
    answer:
      "Absolutely! Go to your dashboard and see votes come as people respond. You can also choose whether voters see current results or wait until everyone's voted.",
  },
  {
    question: "Is there a limit to how many people can vote?",
    answer:
      "Nope! TheJury handles any crowd size you throw at it, or any crowd you throw the poll at. Either way, it works!",
  },
  {
    question: "Can I embed polls on my website or stream?",
    answer:
      "For sure! Get an embed code and drop it anywhere - your blog, Twitch overlay, team website, you name it. Fully customizable to match your vibe.",
  },
];

// --- Animated Word Component ---

function AnimatedWord() {
  const words = [
    "friends",
    "family",
    "colleagues",
    "team",
    "community",
    "audience",
  ];
  const [index, setIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  // Find the longest word to set a stable width
  const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), "");

  return (
    <span className="inline-block relative h-[1.2em] overflow-hidden align-bottom">
      {/* Invisible longest word to reserve width */}
      <span className="invisible whitespace-nowrap">{longestWord}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute left-0 top-0 gradient-text whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// --- Page ---

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 animated-gradient-bg opacity-10 dark:opacity-20" />
        <div className="absolute inset-0 grid-bg" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-[1.1] text-foreground">
                  Let your <AnimatedWord />
                  <br />
                  <span className="gradient-text">decide</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Finally, a poll creator that gets straight to the point.
                  Create polls in seconds, share with your people, and get
                  answers fast.
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

              {/* Trust bar */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IconScale className="w-4 h-4 text-emerald-500" />
                  <span>
                    <AnimatedCounter
                      target={1200}
                      suffix="+"
                      className="font-semibold text-foreground"
                    />{" "}
                    polls created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4 text-emerald-500" />
                  <span>
                    <AnimatedCounter
                      target={8500}
                      suffix="+"
                      className="font-semibold text-foreground"
                    />{" "}
                    votes cast
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right — demo poll */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:pl-4"
            >
              <div className="animate-float">
                <DemoPollWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
                Everything you need to get{" "}
                <span className="gradient-text">consensus</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From casual polls to serious team decisions
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {features.map((feature) => (
              <StaggerItem key={feature.title} className={feature.span}>
                <HoverCard className="h-full">
                  <div className="h-full rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white mb-4">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works — Timeline */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-muted/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
                From question to answer in{" "}
                <span className="gradient-text">three steps</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Ask your question, share with people, and get results
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((item) => (
              <StaggerItem key={item.step}>
                <div className="text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-glow-emerald">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 lg:py-28 bg-slate-900 dark:bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-teal-600/20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <AnimatedCounter
                  target={1200}
                  suffix="+"
                  className="text-4xl sm:text-5xl font-display text-white"
                />
                <p className="text-slate-400 mt-2 text-sm uppercase tracking-wider">
                  Polls Created
                </p>
              </div>
              <div>
                <AnimatedCounter
                  target={8500}
                  suffix="+"
                  className="text-4xl sm:text-5xl font-display text-white"
                />
                <p className="text-slate-400 mt-2 text-sm uppercase tracking-wider">
                  Votes Cast
                </p>
              </div>
              <div>
                <AnimatedCounter
                  target={500}
                  suffix="+"
                  className="text-4xl sm:text-5xl font-display text-white"
                />
                <p className="text-slate-400 mt-2 text-sm uppercase tracking-wider">
                  Happy Users
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
                Frequently asked <span className="gradient-text">questions</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Common questions on using TheJury for your polls
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border bg-card px-6 data-[state=open]:border-emerald-500/50 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-display text-white mb-4">
              Ready to settle the debate?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join TheJury for free and start making group decisions the easy
              way.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/create">
                <Button
                  size="xl"
                  className="bg-white text-emerald-700 hover:bg-white/90 shadow-lg gap-2"
                >
                  Make Your First Poll
                  <IconArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  Join the Community
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
