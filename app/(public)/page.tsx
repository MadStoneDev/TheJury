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
        "Build compelling polls in under 30 seconds. Present your question to the community.",
    },
    {
      icon: <IconUsers className="w-6 h-6" />,
      title: "Get Responses",
      description:
        "Gather responses from your audience. Track changes and manage all your polls from one dashboard.",
    },
    {
      icon: <IconScale className="w-6 h-6" />,
      title: "Schedule Polls",
      description:
        "Set start and end dates for each poll (optional). Control exactly when polls go live and when verdicts are final.",
    },
    {
      icon: <IconCode className="w-6 h-6" />,
      title: "See Results",
      description:
        "Embed polls anywhere to reach your jury. Simple integration codes make deployment effortless.",
    },
  ];

  const faqs: FAQ[] = [
    {
      question: "How quickly can I create a poll?",
      answer:
        "You can create a poll in under 30 seconds! Just write your question, add the options, and share it with your audience. Our streamlined process makes it incredibly fast to get answers.",
    },
    {
      question: "Can I schedule when my poll opens and closes?",
      answer:
        "Absolutely! Set custom start and end times for when your poll opens and closes. Perfect for timed decisions, event planning, or deadline-driven voting.",
    },
    {
      question: "How do I share my poll?",
      answer:
        "Share your poll via direct links, QR codes, social media, or embed it directly on your website. We make reaching your audience as easy as possible.",
    },
    {
      question: "Can I watch responses come in real-time?",
      answer:
        "Yes! Watch votes come in live as people respond. You can also choose whether voters see the current results or only the final tally after voting closes.",
    },
    {
      question: "Is there a limit to how many people can vote?",
      answer:
        "No limits on responses! Whether you need 12 votes or 12,000, TheJury scales to handle any poll size you can throw at it.",
    },
    {
      question: "Can I embed polls on my website?",
      answer:
        "Yes! Get an embed code for any poll and add it to your website, blog, or app. Fully customizable to match your site's style.",
    },
  ];

  const toggleFaq = (index: number): void => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const HeroSection: React.FC = () => (
    <section className="relative bg-gradient-to-br from-emerald-50 to-blue-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Let the jury
                <span className="text-emerald-600 block">decide</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Build polls in seconds, share with your chosen jury, and get the
                verdict in a snap - the easiest way to get answers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`/create`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Present Your First Case
                <IconArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`/auth/sign-up`}
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                Join the Jury Pool
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
            Your complete poll creating toolkit
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From simple questions to complex cases
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
            From question to verdict in three steps
          </h2>
          <p className="text-xl text-gray-600">
            Present your case, summon the jury, and receive your verdict
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Present Your Case
            </h3>
            <p className="text-gray-600 mb-6">
              State your question clearly and present the options. Set the rules
              for deliberation - single choice, multiple choice, time limits,
              and more.
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
              Summon Your Jury
            </h3>
            <p className="text-gray-600 mb-6">
              Call your jury to order via link, QR code, or embed on your
              website. Watch as deliberation unfolds in real-time on your
              dashboard.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <IconShare className="w-5 h-5 text-emerald-600" />
                <IconGlobe className="w-5 h-5 text-blue-600" />
                <IconCode className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded">
                thejury.app/verdict/ABC123XYZ
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Receive the Verdict
            </h3>
            <p className="text-gray-600 mb-6">
              Analyze the jury&apos;s decision with detailed insights, export
              the evidence, and share the final verdict. Get the clarity you
              need for confident decisions.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <IconChartBar className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Guilty</span>
                  <span className="font-semibold">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: "67%" }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Not Guilty</span>
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

  const StatsSection: React.FC = () => (
    <section className="py-16 bg-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <div className="text-4xl font-bold mb-2">Swift</div>
            <div className="text-emerald-100">30-second case setup</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">Fair</div>
            <div className="text-emerald-100">Unbiased jury selection</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">Just</div>
            <div className="text-emerald-100">Transparent verdicts</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">Free</div>
            <div className="text-emerald-100">No court fees to start</div>
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
            Everything you need to know about presenting cases to TheJury
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
          Ready to settle debates?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands who trust TheJury to deliver fair verdicts on their
          most important decisions
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
          >
            Present Your Case
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
      <StatsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
