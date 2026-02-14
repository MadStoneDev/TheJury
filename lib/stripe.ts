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
  priceMonthly: number;
  priceAnnualMonthly: number;
  priceAnnualTotal: number;
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
}

export const TIERS: Record<TierName, TierConfig> = {
  free: {
    name: "Free",
    priceId: null,
    priceIdAnnual: null,
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    priceAnnualTotal: 0,
    maxActivePolls: 5,
    maxQuestionsPerPoll: 2,
    removeBranding: false,
    csvExport: false,
    qrCodes: false,
    scheduling: false,
    ratingScale: false,
    rankedChoice: false,
    imageOptions: false,
    openEnded: false,
    reactionPolls: false,
    templates: false,
    aiGeneration: false,
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
  },
  pro: {
    name: "Pro",
    priceId: null, // resolved at runtime via getProPriceId()
    priceIdAnnual: null, // resolved at runtime via getProAnnualPriceId()
    priceMonthly: 15,
    priceAnnualMonthly: 12,
    priceAnnualTotal: 144,
    maxActivePolls: -1, // unlimited
    maxQuestionsPerPoll: -1, // unlimited
    removeBranding: true,
    csvExport: true,
    qrCodes: true,
    scheduling: true,
    ratingScale: true,
    rankedChoice: true,
    imageOptions: true,
    openEnded: false,
    reactionPolls: false,
    templates: true,
    aiGeneration: true,
    passwordProtect: true,
    customEmbedThemes: true,
    chartTypes: true,
    customLogoEmbed: false,
    advancedAnalytics: false,
    webhooks: false,
    customDomains: false,
    teamWorkspace: false,
    abTesting: false,
    apiAccess: false,
  },
  team: {
    name: "Team",
    priceId: null, // resolved at runtime via getTeamPriceId()
    priceIdAnnual: null, // resolved at runtime via getTeamAnnualPriceId()
    priceMonthly: 39,
    priceAnnualMonthly: 32,
    priceAnnualTotal: 384,
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

export function getTeamAnnualPriceId(): string | null {
  return process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || null;
}

export function getTierByPriceId(priceId: string): TierName {
  if (
    priceId === getProPriceId() ||
    priceId === getProAnnualPriceId()
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
