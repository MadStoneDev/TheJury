import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export type TierName = "free" | "pro" | "team";

export interface TierConfig {
  name: string;
  priceId: string | null;
  priceIdAnnual: string | null;
  priceIdLifetime: string | null;
  priceMonthly: number;
  priceAnnualMonthly: number;
  priceAnnualTotal: number;
  priceLifetime: number; // 0 = no lifetime option
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
    name: "Pro",
    priceId: null, // resolved at runtime via getProPriceId()
    priceIdAnnual: null, // resolved at runtime via getProAnnualPriceId()
    priceIdLifetime: null, // resolved at runtime via getProLifetimePriceId()
    priceMonthly: 9,
    priceAnnualMonthly: 7.5, // A$90/yr billed annually
    priceAnnualTotal: 90,
    priceLifetime: 199, // one-off
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
    apiAccess: true, // public API (v1) + per-user keys, e.g. the Tabletop Chronicles integration
    presenterMode: true,
  },
  // Legacy tier, no longer sold or shown in the UI. Kept so existing
  // "team" subscribers retain their features until migrated. Do not surface.
  team: {
    name: "Team",
    priceId: null, // resolved at runtime via getTeamPriceId()
    priceIdAnnual: null, // resolved at runtime via getTeamAnnualPriceId()
    priceIdLifetime: null,
    priceMonthly: 39,
    priceAnnualMonthly: 32,
    priceAnnualTotal: 384,
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
