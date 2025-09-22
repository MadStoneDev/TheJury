"use client";

import React, { useState } from "react";
import {
  IconChevronDown,
  IconUsers,
  IconCode,
  IconShare,
  IconChartBar,
  IconGlobe,
  IconArrowRight,
  IconScale,
  IconGavel,
} from "@tabler/icons-react";
import DemoPollWidget from "@/components/DemoPollWidget";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features: Feature[] = [
    {
      icon: <IconGavel className="w-6 h-6" />,
      title: "Ask Your Question",
      description:
        "Create polls in under 30 seconds. Get your crew's opinion on anything, anytime.",
    },
    {
      icon: <IconUsers className="w-6 h-6" />,
      title: "Gather Responses",
      description:
        "Watch votes roll in from your friends, team, or community. Track everything from one simple dashboard.",
    },
    {
      icon: <IconScale className="w-6 h-6" />,
      title: "Schedule Polls",
      description:
        "Set start and end times for each poll (optional). Perfect for event planning or time-sensitive decisions.",
    },
    {
      icon: <IconCode className="w-6 h-6" />,
      title: "Share Everywhere",
      description:
        "Drop your poll in Discord, Slack, social media, or embed it anywhere. Reach your people however they hang out.",
    },
  ];

  const faqs: FAQ[] = [
    {
      question: "How quickly can I create a poll?",
      answer:
        "Less than 30 seconds! Just type your question, add some options, and share the link. It's honestly faster than trying to decide in your group chat.",
    },
    {
      question: "Can I schedule when my poll opens and closes?",
      answer:
        "Yep! Set it up ahead of time and let it auto-close when you need it to. Great for planning hangouts, team meetings, or any time-sensitive group decision.",
    },
    {
      question: "How do I share my poll with my friends?",
      answer:
        "However you want! Send the link directly, share it on social media, drop it in your Discord server, or embed it on your website. We made it work everywhere your people are.",
    },
    {
      question: "Can I watch responses come in real-time?",
      answer:
        "Absolutely! See votes come in live as people respond. You can choose whether voters see current results or wait until everyone's voted.",
    },
    {
      question: "Is there a limit to how many people can vote?",
      answer:
        "Nope! Whether it's your 5-person friend group or your 5,000-member gaming community, TheJury handles any crowd size you throw at it.",
    },
    {
      question: "Can I embed polls on my website or stream?",
      answer:
        "For sure! Get an embed code and drop it anywhere - your blog, Twitch overlay, team website, you name it. Fully customizable to match your vibe.",
    },
  ];

  const toggleFaq = (index: number): void => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const AnimatedWord: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const words = [
      "friends",
      "family",
      "colleagues",
      "team",
      "community",
      "audience",
    ];
    const doubledWords = [...words, words[0]]; // Add first word to the end for seamless loop

    React.useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;

          if (nextIndex >= doubledWords.length) {
            return 0;
          }

          if (nextIndex === doubledWords.length - 1) {
            setTimeout(() => {
              setIsTransitioning(false);
              setCurrentIndex(0);
              setTimeout(() => setIsTransitioning(true), 50);
            }, 750);
          }
          return nextIndex;
        });
      }, 2000);

      return () => clearInterval(interval);
    }, [doubledWords.length]);

    return (
      <div className="inline-block overflow-hidden h-[1.2em] align-top">
        <div
          className={`flex flex-col ${
            isTransitioning
              ? "transition-transform duration-500 ease-in-out"
              : ""
          }`}
          style={{
            transform: `translateY(-${currentIndex * 1.2}em)`,
          }}
        >
          {doubledWords.map((word, index) => (
            <span key={index} className="h-[1.2em] flex items-center">
              {word}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const HeroSection: React.FC = () => (
    <section className="relative bg-gradient-to-br from-emerald-50 to-blue-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Let your <AnimatedWord />
                <span className="text-emerald-600 block">decide</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Create polls in seconds, share with your people, and get answers
                fast - the easiest way to make group decisions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`/create`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Create Your First Poll
                <IconArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`/auth/sign-up`}
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                Join the Community
              </a>
            </div>
          </div>

          {/* Right side - Database-driven demo poll */}
          <div className="lg:pl-8">
            <DemoPollWidget />
          </div>
        </div>
      </div>
    </section>
  );

  const FeaturesSection: React.FC = () => (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to get group decisions done
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From quick friend polls to serious team decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const HowItWorksSection: React.FC = () => (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            From question to answer in three easy steps
          </h2>
          <p className="text-xl text-gray-600">
            Ask your question, share with your people, and get the results
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ask Your Question
            </h3>
            <p className="text-gray-600 mb-6">
              Type your question and add the options. Whether it's "pizza or
              tacos?" or "which marketing strategy should we use?", set it up
              exactly how you want.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Share With Your People
            </h3>
            <p className="text-gray-600 mb-6">
              Drop the link in your group chat, Discord server, social media, or
              wherever your crew hangs out. Watch responses come in real-time on
              your dashboard.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <IconShare className="w-5 h-5 text-emerald-600" />
                <IconGlobe className="w-5 h-5 text-blue-600" />
                <IconCode className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded">
                thejury.app/answer/ABC123XYZ
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Get Your Answer
            </h3>
            <p className="text-gray-600 mb-6">
              See the results with clear visuals, export the data if you need
              it, and share the final results. Make confident decisions backed
              by real input.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <IconChartBar className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Option A</span>
                  <span className="font-semibold">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: "67%" }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Option B</span>
                  <span className="font-semibold">33%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: "33%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const FAQSection: React.FC = () => (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">FAQ</h2>
          <p className="text-xl text-gray-600">
            Common questions about using TheJury for your polls
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-semibold text-gray-900">
                  {faq.question}
                </span>
                <IconChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const CTASection: React.FC = () => (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Ready to settle the debate?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands who use TheJury to make group decisions without the
          endless back-and-forth
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
          >
            Make Your First Poll
            <IconArrowRight className="w-5 h-5" />
          </a>
          <a
            href="/auth/sign-up"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
          >
            Join the Community
          </a>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
