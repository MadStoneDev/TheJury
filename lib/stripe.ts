import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// Internal tier keys are unchanged so existing DB rows, Stripe price mapping and
// the webhook keep working. Public presentation is:
//   free → "Free", pro → "Organisation", team → "Council & Enterprise".
// CLAIM-FLAG (pricing): the prices below are PLACEHOLDERS agreed for the AU
// repositioning. Confirm them and create the matching Stripe prices
// (STRIPE_PRO_PRICE_ID / _ANNUAL, and Council billing) before launch.
export type TierName = "free" | "pro" | "team";

export interface TierConfig {
  name: string;
  /** Contact-sales tier: no self-serve checkout ("Talk to us"). */
  contactSales?: boolean;
  priceId: string | null;
  priceIdAnnual: string | null;
  priceIdLifetime: string | null;
  priceMonthly: number;
  priceAnnualMonthly: number;
  priceAnnualTotal: number;
  priceLifetime: number; // 0 = no lifetime option (no longer sold publicly)
  maxActivePolls: number; // -1 = unlimited
  maxQuestionsPerPoll: number; // -1 = unlimited
  removeBranding: boolean;
  csvExport: boolean;
  qrCodes: boolean;
  scheduling: boolean;
  ratingScale: boolean;
  rankedChoice: boolean;
  imageOptions: boolean;
  openEnded: boolean;
  reactionPolls: boolean;
  templates: boolean;
  aiGeneration: boolean;
  passwordProtect: boolean;
  customEmbedThemes: boolean;
  chartTypes: boolean;
  customLogoEmbed: boolean;
  advancedAnalytics: boolean;
  webhooks: boolean;
  customDomains: boolean;
  teamWorkspace: boolean;
  abTesting: boolean;
  apiAccess: boolean;
  presenterMode: boolean;
}

export const TIERS: Record<TierName, TierConfig> = {
  free: {
    name: "Free",
    priceId: null,
    priceIdAnnual: null,
    priceIdLifetime: null,
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    priceAnnualTotal: 0,
    priceLifetime: 0,
    maxActivePolls: -1, // unlimited polls on Free
    maxQuestionsPerPoll: 2,
    removeBranding: false, // TheJury branding stays on
    csvExport: false,
    qrCodes: false,
    scheduling: false,
    ratingScale: true, // Free: multiple choice + rating + yes/no
    rankedChoice: false,
    imageOptions: false,
    openEnded: false,
    reactionPolls: false,
    templates: false,
    aiGeneration: true, // capped at 3/month, enforced server-side in the AI route
    passwordProtect: false,
    customEmbedThemes: false,
    chartTypes: false,
    customLogoEmbed: false,
    advancedAnalytics: false,
    webhooks: false,
    customDomains: false,
    teamWorkspace: false,
    abTesting: false,
    apiAccess: false,
    presenterMode: false,
  },
  pro: {
    name: "Organisation",
    priceId: null, // resolved at runtime via getProPriceId()
    priceIdAnnual: null, // resolved at runtime via getProAnnualPriceId()
    priceIdLifetime: null, // resolved at runtime via getProLifetimePriceId()
    priceMonthly: 9, // A$9/mo (placeholder — confirm)
    priceAnnualMonthly: 7.5, // A$90/yr billed annually
    priceAnnualTotal: 90,
    // Lifetime is no longer sold publicly (dropped from the pricing pages).
    // Kept non-zero only so existing lifetime price IDs still map to this tier.
    priceLifetime: 199,
    maxActivePolls: -1, // unlimited
    maxQuestionsPerPoll: -1, // unlimited
    removeBranding: true,
    csvExport: true,
    qrCodes: true,
    scheduling: true,
    ratingScale: true,
    rankedChoice: true,
    imageOptions: true,
    openEnded: true,
    reactionPolls: true,
    templates: true,
    aiGeneration: true, // unlimited
    passwordProtect: true,
    customEmbedThemes: true,
    chartTypes: true,
    customLogoEmbed: true,
    advancedAnalytics: true,
    // Team-only features removed from the product (columns kept in DB, unused):
    webhooks: false,
    customDomains: false,
    teamWorkspace: false,
    abTesting: false,
    apiAccess: true, // public API (v1) + per-user keys for partner integrations
    presenterMode: true,
  },
  // Repurposed from the legacy "Team" tier into the public "Council &
  // Enterprise" tier. Existing "team" subscribers keep their features. This is a
  // contact-sales / invoice-billed tier: no self-serve Stripe checkout.
  team: {
    name: "Council & Enterprise",
    contactSales: true,
    priceId: null, // resolved at runtime via getTeamPriceId()
    priceIdAnnual: null, // resolved at runtime via getTeamAnnualPriceId()
    priceIdLifetime: null,
    priceMonthly: 79, // A$79/mo (placeholder — confirm)
    priceAnnualMonthly: 65.83,
    priceAnnualTotal: 790, // A$790/yr, invoice billing available
    priceLifetime: 0,
    maxActivePolls: -1, // unlimited
    maxQuestionsPerPoll: -1, // unlimited
    removeBranding: true,
    csvExport: true,
    qrCodes: true,
    scheduling: true,
    ratingScale: true,
    rankedChoice: true,
    imageOptions: true,
    openEnded: true,
    reactionPolls: true,
    templates: true,
    aiGeneration: true,
    passwordProtect: true,
    customEmbedThemes: true,
    chartTypes: true,
    customLogoEmbed: true,
    advancedAnalytics: true,
    webhooks: true,
    customDomains: true,
    teamWorkspace: true,
    abTesting: true,
    apiAccess: true,
    presenterMode: true,
  },
};

export function getProPriceId(): string | null {
  return process.env.STRIPE_PRO_PRICE_ID || null;
}

export function getTeamPriceId(): string | null {
  return process.env.STRIPE_TEAM_PRICE_ID || null;
}

export function getProAnnualPriceId(): string | null {
  return process.env.STRIPE_PRO_ANNUAL_PRICE_ID || null;
}

export function getProLifetimePriceId(): string | null {
  return process.env.STRIPE_PRO_LIFETIME_PRICE_ID || null;
}

export function getTeamAnnualPriceId(): string | null {
  return process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || null;
}

/** One-off (mode: payment) prices — everything else is a subscription. */
export function isLifetimePriceId(priceId: string): boolean {
  const lifetime = getProLifetimePriceId();
  return !!lifetime && priceId === lifetime;
}

export function getTierByPriceId(priceId: string): TierName {
  if (
    priceId === getProPriceId() ||
    priceId === getProAnnualPriceId() ||
    priceId === getProLifetimePriceId()
  ) {
    return "pro";
  }
  if (
    priceId === getTeamPriceId() ||
    priceId === getTeamAnnualPriceId()
  ) {
    return "team";
  }
  return "free";
}
