import {
  IconUsers,
  IconCode,
  IconShare,
  IconArrowRight,
  IconGavel,
  IconClock,
  IconBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import { Button } from "@/components/ui/button";
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getLandingStats } from "@/lib/landingStats.server";

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
    description: "Discord, WhatsApp, social media, or anywhere you like.",
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

// --- Page ---

export default async function HomePage() {
  const stats = await getLandingStats();

  return (
    <div className="min-h-screen">
      <Hero stats={stats} />

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
