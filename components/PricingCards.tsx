"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { TierName, TierConfig } from "@/lib/stripe";

type Currency = "AUD" | "USD" | "EUR";

const CURRENCY_CONFIG: Record<
  Currency,
  { symbol: string; rate: number }
> = {
  AUD: { symbol: "A$", rate: 1 },
  USD: { symbol: "$", rate: 0.63 },
  EUR: { symbol: "€", rate: 0.58 },
};

function convert(aud: number, currency: Currency): string {
  if (aud === 0) return "0";
  return String(Math.round(aud * CURRENCY_CONFIG[currency].rate));
}

const FREE_FEATURES = [
  "Unlimited votes on every poll",
  "Unlimited polls, 2 questions each",
  "Multiple choice & rating questions",
  "Live results with bar charts",
  "Share by link, code or QR",
  "Voting without an account",
  "3 AI-drafted polls a month",
  "Results dashboard & history",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited active polls and questions",
  "Ranked choice, image, open-ended & reactions",
  "Branded embeds & stream overlays",
  "Scheduling, time limits & passwords",
  "CSV export & pie / donut charts",
  "Unlimited AI drafting & all templates",
  "Priority support",
];

const COMPARE: { name: string; free: string | boolean; pro: string | boolean }[] = [
  { name: "Active polls", free: "Unlimited", pro: "Unlimited" },
  { name: "Questions per poll", free: "2", pro: "Unlimited" },
  { name: "Votes per poll", free: "Unlimited", pro: "Unlimited" },
  { name: "Multiple choice", free: true, pro: true },
  { name: "Rating questions", free: true, pro: true },
  { name: "Ranked choice", free: false, pro: true },
  { name: "Image options", free: false, pro: true },
  { name: "Open-ended responses", free: false, pro: true },
  { name: "Reaction polls", free: false, pro: true },
  { name: "AI drafting", free: "3 / month", pro: "Unlimited" },
  { name: "Result charts", free: "Bar", pro: "Bar, pie, donut" },
  { name: "Share link, code & QR", free: true, pro: true },
  { name: "Embed polls", free: "Basic", pro: "Branded + overlays" },
  { name: "Custom embed theme", free: false, pro: true },
  { name: "Remove TheJury branding", free: false, pro: true },
  { name: "Scheduling & time limits", free: false, pro: true },
  { name: "Password protection", free: false, pro: true },
  { name: "CSV export", free: false, pro: true },
];

interface PricingCardsProps {
  tiers: Record<TierName, TierConfig>;
  currentTier: TierName;
  isLoggedIn: boolean;
}

export default function PricingCards({
  tiers,
  currentTier,
  isLoggedIn,
}: PricingCardsProps) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState<Currency>("AUD");
  const [compareOpen, setCompareOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const pro = tiers.pro;
  const { symbol } = CURRENCY_CONFIG[currency];
  const savings = Math.round(
    ((pro.priceMonthly * 12 - pro.priceAnnualTotal) / (pro.priceMonthly * 12)) *
      100,
  );

  const checkout = async (priceId: string | null, key: string) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-up");
      return;
    }
    if (!priceId) return;
    setLoading(key);
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
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const segBtn = (active: boolean) =>
    `px-4 py-1.5 text-[13px] font-medium rounded-full transition ${
      active
        ? "bg-jury-emerald text-jury-on-emerald"
        : "text-jury-muted hover:text-jury-text"
    }`;

  const proPrice = annual
    ? convert(pro.priceAnnualTotal, currency)
    : convert(pro.priceMonthly, currency);
  const proSuffix = annual ? "/yr" : "/mo";
  const proNote = annual
    ? `Billed yearly — ${savings > 0 ? `${savings}% off` : "save"}`
    : "Billed monthly, cancel any time.";
  const isProCurrent = currentTier === "pro";

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-jury-border bg-jury-surface p-1">
          <button onClick={() => setAnnual(false)} className={segBtn(!annual)}>
            Monthly
          </button>
          <button onClick={() => setAnnual(true)} className={`${segBtn(annual)} flex items-center gap-1.5`}>
            Annual
            <span className="text-[11px] font-semibold text-jury-emerald-hi">
              Save {savings}%
            </span>
          </button>
        </div>
      </div>
      <div className="mb-12 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-jury-border bg-jury-surface p-1">
          {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
            <button key={c} onClick={() => setCurrency(c)} className={segBtn(currency === c)}>
              {CURRENCY_CONFIG[c].symbol} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-[960px] gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-xl border border-jury-border bg-jury-surface p-8">
          <h3 className="text-[17px] font-semibold text-jury-text">Free</h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-[44px] leading-none text-jury-text">
              {symbol}0
            </span>
            <span className="text-[14px] text-jury-dim">forever</span>
          </div>
          <p className="mt-3 text-[15px] text-jury-muted">
            Everything you need to settle a group decision.
          </p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] text-jury-body">
                <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-jury-emerald" />
                {f}
              </li>
            ))}
          </ul>
          {isLoggedIn && currentTier === "free" ? (
            <button
              disabled
              className="mt-8 h-11 w-full rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-dim"
            >
              Current plan
            </button>
          ) : (
            <button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/auth/sign-up")}
              className="mt-8 h-11 w-full rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              {isLoggedIn ? "Go to dashboard" : "Get started free"}
            </button>
          )}
        </div>

        {/* Pro */}
        <div
          className="relative rounded-xl border p-8"
          style={{
            borderColor: "rgba(16,185,129,0.45)",
            background: "#0F1520",
            boxShadow:
              "0 0 0 1px rgba(16,185,129,.1), 0 30px 70px -34px rgba(16,185,129,.55)",
          }}
        >
          <span className="absolute -top-[13px] left-[34px] rounded-full bg-jury-emerald px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-jury-on-emerald">
            Most Popular
          </span>
          <h3 className="text-[17px] font-semibold text-jury-text">Pro</h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-[44px] leading-none text-jury-emerald-hi">
              {symbol}{proPrice}
            </span>
            <span className="text-[14px] text-jury-dim">{proSuffix}</span>
          </div>
          <p className="mt-1 text-[13px] text-jury-dim">{proNote}</p>

          {/* Lifetime row */}
          {pro.priceLifetime > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-[10px] border border-jury-emerald-line bg-jury-emerald-tint px-3.5 py-2.5">
              <div className="text-[13px]">
                <span className="font-semibold text-jury-text">
                  Lifetime — {symbol}{convert(pro.priceLifetime, currency)}
                </span>
                <span className="text-jury-muted"> · Pay once, keep Pro forever</span>
              </div>
              <button
                onClick={() => checkout(pro.priceIdLifetime, "lifetime")}
                disabled={loading !== null}
                className="shrink-0 rounded-full bg-jury-emerald px-3 py-1 text-[12px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi disabled:opacity-60"
              >
                {loading === "lifetime" ? "…" : "Choose"}
              </button>
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] text-jury-body">
                <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-jury-emerald" />
                {f}
              </li>
            ))}
          </ul>

          {isProCurrent ? (
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="mt-8 h-11 w-full rounded-full border border-jury-emerald-line text-[15px] font-medium text-jury-emerald-hi transition hover:bg-jury-emerald-tint"
            >
              {loading === "portal" ? "Loading…" : "Manage billing"}
            </button>
          ) : (
            <button
              onClick={() => checkout(annual ? pro.priceIdAnnual : pro.priceId, "pro")}
              disabled={loading !== null}
              className="mt-8 h-11 w-full rounded-full bg-jury-emerald text-[15px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi disabled:opacity-60"
            >
              {loading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </div>

      {/* Compare all features */}
      <div className="mx-auto mt-8 max-w-[960px]">
        <div className="overflow-hidden rounded-xl border border-jury-border bg-jury-surface">
          <button
            onClick={() => setCompareOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <span>
              <span className="text-[17px] font-semibold text-jury-text">
                Compare all features
              </span>
              <span className="ml-2 text-[14px] text-jury-dim">
                Every limit and feature, line by line
              </span>
            </span>
            <ChevronDown
              size={20}
              className={`shrink-0 text-jury-muted transition-transform duration-200 ${
                compareOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {compareOpen && (
            <table className="w-full border-t border-jury-border-subtle text-[14px]">
              <thead>
                <tr className="text-[12px] uppercase tracking-[0.06em] text-jury-dim">
                  <th className="px-6 py-3 text-left font-semibold">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold">Free</th>
                  <th className="px-4 py-3 text-left font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.name} className="border-t border-jury-border-subtle">
                    <td className="px-6 py-3 text-jury-body">{row.name}</td>
                    <td className="px-4 py-3 text-jury-muted">
                      {renderCell(row.free, false)}
                    </td>
                    <td className="px-4 py-3 text-jury-emerald-hi">
                      {renderCell(row.pro, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] text-jury-dim">
        Prices shown in {currency}. Cancel any time — your polls stay live on the
        free tier.
      </p>
    </div>
  );
}

function renderCell(v: string | boolean, pro: boolean) {
  if (v === true)
    return <Check size={16} strokeWidth={2.2} className={pro ? "text-jury-emerald" : "text-jury-muted"} />;
  if (v === false)
    return <X size={16} strokeWidth={2} className="text-jury-faint" />;
  return v;
}
