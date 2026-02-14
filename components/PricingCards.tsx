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

interface PricingCardsProps {
  tiers: Record<TierName, TierConfig>;
  currentTier: TierName;
  isLoggedIn: boolean;
}

interface FeatureItem {
  label: string;
  key: keyof TierConfig;
}

const FEATURES: FeatureItem[] = [
  { label: "Unlimited polls", key: "name" }, // always true, handled specially
  { label: "Remove branding", key: "removeBranding" },
  { label: "CSV export", key: "csvExport" },
  { label: "QR codes", key: "qrCodes" },
  { label: "Scheduling", key: "scheduling" },
  { label: "Team workspace", key: "teamWorkspace" },
  { label: "A/B testing", key: "abTesting" },
  { label: "API access", key: "apiAccess" },
  { label: "Advanced analytics", key: "analytics" },
];

export default function PricingCards({
  tiers,
  currentTier,
  isLoggedIn,
}: PricingCardsProps) {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<TierName | null>(null);

  const handleCheckout = async (tier: TierName) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-up");
      return;
    }

    const priceId = tiers[tier].priceId;
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

  const tierOrder: TierName[] = ["free", "pro", "team"];

  return (
    <StaggerContainer
      className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
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
                        isPopular
                          ? "gradient-text"
                          : "text-foreground"
                      }`}
                    >
                      ${tier.priceMonthly}
                    </span>
                    {tier.priceMonthly > 0 && (
                      <span className="text-muted-foreground ml-1">/mo</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tierKey === "free" && "Up to 100 votes per poll"}
                    {tierKey === "pro" && "Unlimited votes, no branding"}
                    {tierKey === "team" &&
                      "Everything in Pro, plus team features"}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {/* Votes */}
                  <li className="flex items-start gap-2">
                    <IconCheck
                      size={18}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-foreground">
                      {tierKey === "free"
                        ? "100 votes per poll"
                        : "Unlimited votes per poll"}
                    </span>
                  </li>

                  {/* Unlimited polls - always true */}
                  <li className="flex items-start gap-2">
                    <IconCheck
                      size={18}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-foreground">
                      Unlimited polls
                    </span>
                  </li>

                  {/* Dynamic features */}
                  {FEATURES.filter((f) => f.key !== "name").map((feature) => {
                    const enabled = tier[feature.key] as boolean;
                    return (
                      <li key={feature.key} className="flex items-start gap-2">
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
                          {feature.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
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
  );
}
