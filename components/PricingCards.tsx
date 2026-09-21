"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import type { TierName, TierConfig } from "@/lib/stripe";

// CLAIM-FLAG (pricing + features): prices are placeholders (see lib/stripe.ts).
// "Anonymous voting", "Verified voting" and the PDF results record are the
// target-state features the tiers are sold on; CSV export exists today, the rest
// need confirming before launch. Contact email is a placeholder.
const CONTACT_EMAIL = "hello@thejury.app"; // placeholder — confirm

type Currency = "AUD" | "USD" | "EUR";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; rate: number }> = {
  AUD: { symbol: "A$", rate: 1 },
  USD: { symbol: "$", rate: 0.63 },
  EUR: { symbol: "€", rate: 0.58 },
};

function convert(aud: number, currency: Currency): string {
  if (aud === 0) return "0";
  return String(Math.round(aud * CURRENCY_CONFIG[currency].rate));
}

const FREE_FEATURES = [
  "Public polls with live results",
  "Unlimited polls, single admin",
  "Multiple choice and rating questions",
  "Share by link, code or QR",
  "No account needed to vote",
  "TheJury branding on the poll page",
];

const ORG_FEATURES = [
  "Everything in Free",
  "Anonymous and verified voting",
  "Results record (PDF and CSV)",
  "Private polls: password, time limits, member lists",
  "Remove TheJury branding",
  "One organisation, up to 3 admins",
  "Email support",
];

const COUNCIL_FEATURES = [
  "Everything in Organisation",
  "Unlimited admins",
  "Priority support",
  "Custom subdomain and branding",
  "Single sign-on (on request)",
  "Invoice billing available",
];

type Cell = string | boolean;
const COMPARE: { name: string; free: Cell; org: Cell; council: Cell }[] = [
  { name: "Public polls & live results", free: true, org: true, council: true },
  { name: "Hosted in Australia", free: true, org: true, council: true },
  { name: "No account needed to vote", free: true, org: true, council: true },
  { name: "Anonymous voting", free: false, org: true, council: true },
  { name: "Verified voting (one link per member)", free: false, org: true, council: true },
  { name: "Results record", free: false, org: "PDF & CSV", council: "PDF & CSV" },
  { name: "Private polls (password, time limits)", free: false, org: true, council: true },
  { name: "Remove TheJury branding", free: false, org: true, council: true },
  { name: "Admins", free: "1", org: "Up to 3", council: "Unlimited" },
  { name: "Custom subdomain & branding", free: false, org: false, council: true },
  { name: "Single sign-on", free: false, org: false, council: "On request" },
  { name: "Support", free: "Community", org: "Email", council: "Priority" },
  { name: "Billing", free: "—", org: "Card", council: "Card or invoice" },
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

  const org = tiers.pro;
  const council = tiers.team;
  const { symbol } = CURRENCY_CONFIG[currency];
  const savings = Math.round(
    ((org.priceMonthly * 12 - org.priceAnnualTotal) /
      (org.priceMonthly * 12)) *
      100,
  );

  const checkout = async (priceId: string | null, key: string) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-up");
      return;
    }
    if (!priceId) return;
    track("upgrade_clicked", {
      plan: key,
      billing: annual ? "annual" : "monthly",
    });
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

  const orgPrice = annual
    ? convert(org.priceAnnualTotal, currency)
    : convert(org.priceMonthly, currency);
  const orgSuffix = annual ? "/yr" : "/mo";
  const orgNote = annual
    ? `Billed yearly, GST inclusive. ${savings > 0 ? `Save ${savings}%.` : ""}`
    : "Billed monthly, GST inclusive.";
  const isOrgCurrent = currentTier === "pro";
  const isCouncilCurrent = currentTier === "team";

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-jury-border bg-jury-surface p-1">
          <button onClick={() => setAnnual(false)} className={segBtn(!annual)}>
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`${segBtn(annual)} flex items-center gap-1.5`}
          >
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
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={segBtn(currency === c)}
            >
              {CURRENCY_CONFIG[c].symbol} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
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
            Try it with your team. Public polls, one admin.
          </p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[15px] text-jury-body"
              >
                <Check
                  size={18}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-jury-emerald"
                />
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
              onClick={() =>
                router.push(isLoggedIn ? "/dashboard" : "/auth/sign-up")
              }
              className="mt-8 h-11 w-full rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              {isLoggedIn ? "Go to dashboard" : "Get started free"}
            </button>
          )}
        </div>

        {/* Organisation — highlighted */}
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
          <h3 className="text-[17px] font-semibold text-jury-text">
            {org.name}
          </h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-[44px] leading-none text-jury-emerald-hi">
              {symbol}
              {orgPrice}
            </span>
            <span className="text-[14px] text-jury-dim">{orgSuffix}</span>
          </div>
          <p className="mt-1 text-[13px] text-jury-dim">{orgNote}</p>

          <ul className="mt-6 space-y-3">
            {ORG_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[15px] text-jury-body"
              >
                <Check
                  size={18}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-jury-emerald"
                />
                {f}
              </li>
            ))}
          </ul>

          {isOrgCurrent ? (
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="mt-8 h-11 w-full rounded-full border border-jury-emerald-line text-[15px] font-medium text-jury-emerald-hi transition hover:bg-jury-emerald-tint"
            >
              {loading === "portal" ? "Loading…" : "Manage billing"}
            </button>
          ) : (
            <button
              onClick={() =>
                checkout(annual ? org.priceIdAnnual : org.priceId, "organisation")
              }
              disabled={loading !== null}
              className="mt-8 h-11 w-full rounded-full bg-jury-emerald text-[15px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi disabled:opacity-60"
            >
              {loading === "organisation" ? "Redirecting…" : "Choose Organisation"}
            </button>
          )}
        </div>

        {/* Council & Enterprise — contact sales */}
        <div className="rounded-xl border border-jury-border bg-jury-surface p-8">
          <h3 className="text-[17px] font-semibold text-jury-text">
            {council.name}
          </h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-[40px] leading-none text-jury-text">
              From {symbol}
              {convert(council.priceMonthly, currency)}
            </span>
            <span className="text-[14px] text-jury-dim">/mo</span>
          </div>
          <p className="mt-1 text-[13px] text-jury-dim">
            Invoice billing available. GST inclusive.
          </p>
          <ul className="mt-6 space-y-3">
            {COUNCIL_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[15px] text-jury-body"
              >
                <Check
                  size={18}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-jury-emerald"
                />
                {f}
              </li>
            ))}
          </ul>
          {isCouncilCurrent ? (
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="mt-8 h-11 w-full rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              {loading === "portal" ? "Loading…" : "Manage billing"}
            </button>
          ) : (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Council%20%26%20Enterprise%20enquiry`}
              className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-jury-border-strong text-[15px] font-medium text-jury-body transition hover:border-white/25"
            >
              Talk to us
            </a>
          )}
        </div>
      </div>

      {/* Compare all features */}
      <div className="mx-auto mt-8 max-w-6xl">
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
            <div className="overflow-x-auto">
              <table className="w-full border-t border-jury-border-subtle text-[14px]">
                <thead>
                  <tr className="text-[12px] uppercase tracking-[0.06em] text-jury-dim">
                    <th className="px-6 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold">Free</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Organisation
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Council &amp; Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr
                      key={row.name}
                      className="border-t border-jury-border-subtle"
                    >
                      <td className="px-6 py-3 text-jury-body">{row.name}</td>
                      <td className="px-4 py-3 text-jury-muted">
                        {renderCell(row.free, false)}
                      </td>
                      <td className="px-4 py-3 text-jury-emerald-hi">
                        {renderCell(row.org, true)}
                      </td>
                      <td className="px-4 py-3 text-jury-body">
                        {renderCell(row.council, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] text-jury-dim">
        Prices shown in {currency}, GST inclusive. Cancel any time. Your polls
        stay live on the free tier.
      </p>
    </div>
  );
}

function renderCell(v: string | boolean, primary: boolean) {
  if (v === true)
    return (
      <Check
        size={16}
        strokeWidth={2.2}
        className={primary ? "text-jury-emerald" : "text-jury-muted"}
      />
    );
  if (v === false)
    return <X size={16} strokeWidth={2} className="text-jury-faint" />;
  return v;
}
