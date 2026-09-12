"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  StaggerContainer,
  StaggerItem,
  HoverCard,
} from "@/components/motion";
import type { TierName, TierConfig } from "@/lib/stripe";

type Currency = "AUD" | "USD" | "EUR";
type BillingPeriod = "monthly" | "annual" | "lifetime";

const CURRENCY_CONFIG: Record<
  Currency,
  { symbol: string; label: string; rate: number }
> = {
  AUD: { symbol: "A$", label: "AUD", rate: 1 },
  USD: { symbol: "$", label: "USD", rate: 0.63 },
  EUR: { symbol: "\u20ac", label: "EUR", rate: 0.58 },
};

function convertPrice(audPrice: number, currency: Currency): string {
  if (audPrice === 0) return "0";
  const converted = audPrice * CURRENCY_CONFIG[currency].rate;
  return Math.round(converted).toString();
}

interface PricingCardsProps {
  tiers: Record<TierName, TierConfig>;
  currentTier: TierName;
  isLoggedIn: boolean;
}

interface FeatureItem {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const FEATURES: FeatureItem[] = [
  { label: "Unlimited polls", free: true, pro: true },
  { label: "Unlimited votes", free: true, pro: true },
  { label: "Questions per poll", free: "2", pro: "Unlimited" },
  { label: "Multiple choice, rating & yes/no", free: true, pro: true },
  { label: "AI poll generation", free: "3/month", pro: "Unlimited" },
  { label: "Remove branding", free: false, pro: true },
  { label: "Ranked choice", free: false, pro: true },
  { label: "Image options", free: false, pro: true },
  { label: "Open-ended & reactions", free: false, pro: true },
  { label: "Poll scheduling", free: false, pro: true },
  { label: "Password protection", free: false, pro: true },
  { label: "Custom embed themes", free: false, pro: true },
  { label: "CSV export", free: false, pro: true },
  { label: "QR codes", free: false, pro: true },
  { label: "Poll templates", free: false, pro: true },
  { label: "Multiple chart types", free: false, pro: true },
  { label: "Advanced analytics", free: false, pro: true },
];

export default function PricingCards({
  tiers,
  currentTier,
  isLoggedIn,
}: PricingCardsProps) {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<TierName | null>(null);
  const [currency, setCurrency] = useState<Currency>("AUD");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const handleCheckout = async (tier: TierName) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-up");
      return;
    }

    const priceId =
      billingPeriod === "lifetime"
        ? tiers[tier].priceIdLifetime
        : billingPeriod === "annual"
          ? tiers[tier].priceIdAnnual
          : tiers[tier].priceId;
    if (!priceId) return;

    setLoadingTier(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handlePortal = async () => {
    setLoadingTier(currentTier);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const tierOrder: Array<"free" | "pro"> = ["free", "pro"];
  const currencies: Currency[] = ["AUD", "USD", "EUR"];
  const { symbol } = CURRENCY_CONFIG[currency];

  const getDisplayPrice = (tier: TierConfig): string => {
    const price =
      billingPeriod === "lifetime"
        ? tier.priceLifetime
        : billingPeriod === "annual"
          ? tier.priceAnnualMonthly
          : tier.priceMonthly;
    return convertPrice(price, currency);
  };

  const proSavings = Math.round(
    ((tiers.pro.priceMonthly - tiers.pro.priceAnnualMonthly) /
      tiers.pro.priceMonthly) *
      100,
  );

  const tierDescriptions: Record<"free" | "pro", string> = {
    free: "Unlimited polls, multiple choice + rating + yes/no",
    pro: "Everything unlocked — all question types and pro tools",
  };

  return (
    <div>
      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center rounded-full bg-muted/50 border border-border p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              billingPeriod === "monthly"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              billingPeriod === "annual"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                billingPeriod === "annual"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              Save {proSavings}%
            </span>
          </button>
          <button
            onClick={() => setBillingPeriod("lifetime")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              billingPeriod === "lifetime"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lifetime
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                billingPeriod === "lifetime"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              Pay once
            </span>
          </button>
        </div>
      </div>

      {/* Currency Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full bg-muted/50 border border-border p-1">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                currency === c
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {CURRENCY_CONFIG[c].symbol} {c}
            </button>
          ))}
        </div>
      </div>

      <StaggerContainer
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-3xl mx-auto"
        staggerDelay={0.15}
      >
        {tierOrder.map((tierKey) => {
          const tier = tiers[tierKey];
          const isCurrent = currentTier === tierKey;
          const isPopular = tierKey === "pro";

          return (
            <StaggerItem key={tierKey}>
              <HoverCard>
                <div
                  className={`relative rounded-2xl bg-card border p-8 flex flex-col transition-shadow duration-300 ${
                    isPopular
                      ? "border-emerald-500/50 scale-105 shadow-glow-emerald animate-pulse-glow z-10"
                      : "border-border"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg shadow-emerald-500/25">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span
                        className={`text-4xl font-bold ${
                          isPopular ? "gradient-text" : "text-foreground"
                        }`}
                      >
                        {symbol}
                        {getDisplayPrice(tier)}
                      </span>
                      {tier.priceMonthly > 0 && (
                        <span className="text-muted-foreground ml-1">
                          {billingPeriod === "lifetime" ? "once" : "/mo"}
                        </span>
                      )}
                    </div>
                    {tier.priceMonthly > 0 && billingPeriod === "annual" && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {symbol}
                        {convertPrice(tier.priceAnnualTotal, currency)}/year
                        &mdash; billed annually
                      </p>
                    )}
                    {tier.priceLifetime > 0 && billingPeriod === "lifetime" && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        One-off payment &mdash; yours forever
                      </p>
                    )}
                    {tier.priceMonthly > 0 &&
                      currency !== "AUD" && (
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          approx. &mdash; charged in AUD
                        </p>
                      )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tierDescriptions[tierKey]}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {FEATURES.map((feature) => {
                      const value = feature[tierKey];
                      const enabled = value !== false;
                      const displayText =
                        typeof value === "string"
                          ? `${feature.label}: ${value}`
                          : feature.label;
                      return (
                        <li
                          key={feature.label}
                          className="flex items-start gap-2"
                        >
                          {enabled ? (
                            <IconCheck
                              size={18}
                              className="text-emerald-500 mt-0.5 shrink-0"
                            />
                          ) : (
                            <IconX
                              size={18}
                              className="text-muted-foreground/40 mt-0.5 shrink-0"
                            />
                          )}
                          <span
                            className={`text-sm ${
                              enabled
                                ? "text-foreground"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            {displayText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                      {tierKey !== "free" && (
                        <button
                          onClick={handlePortal}
                          disabled={loadingTier !== null}
                          className="w-full py-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                        >
                          {loadingTier === tierKey
                            ? "Loading..."
                            : "Manage Billing"}
                        </button>
                      )}
                    </div>
                  ) : tierKey === "free" ? (
                    <Button
                      variant="brand-outline"
                      size="lg"
                      className="w-full"
                      onClick={() =>
                        isLoggedIn
                          ? router.push("/dashboard")
                          : router.push("/auth/sign-up")
                      }
                    >
                      {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? "brand" : "brand-outline"}
                      size="lg"
                      className="w-full"
                      onClick={() => handleCheckout(tierKey)}
                      disabled={loadingTier !== null}
                    >
                      {loadingTier === tierKey
                        ? "Redirecting..."
                        : `Upgrade to ${tier.name}`}
                    </Button>
                  )}
                </div>
              </HoverCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
