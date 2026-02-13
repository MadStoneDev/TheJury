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
  priceMonthly: number;
  maxVotesPerPoll: number;
  removeBranding: boolean;
  csvExport: boolean;
  qrCodes: boolean;
  scheduling: boolean;
  teamWorkspace: boolean;
  abTesting: boolean;
  apiAccess: boolean;
  analytics: boolean;
}

export const TIERS: Record<TierName, TierConfig> = {
  free: {
    name: "Free",
    priceId: null,
    priceMonthly: 0,
    maxVotesPerPoll: 100,
    removeBranding: false,
    csvExport: false,
    qrCodes: false,
    scheduling: false,
    teamWorkspace: false,
    abTesting: false,
    apiAccess: false,
    analytics: false,
  },
  pro: {
    name: "Pro",
    priceId: null, // resolved at runtime via getProPriceId()
    priceMonthly: 9,
    maxVotesPerPoll: -1, // -1 = unlimited
    removeBranding: true,
    csvExport: true,
    qrCodes: true,
    scheduling: true,
    teamWorkspace: false,
    abTesting: false,
    apiAccess: false,
    analytics: false,
  },
  team: {
    name: "Team",
    priceId: null, // resolved at runtime via getTeamPriceId()
    priceMonthly: 29,
    maxVotesPerPoll: -1, // -1 = unlimited
    removeBranding: true,
    csvExport: true,
    qrCodes: true,
    scheduling: true,
    teamWorkspace: true,
    abTesting: true,
    apiAccess: true,
    analytics: true,
  },
};

export function getProPriceId(): string | null {
  return process.env.STRIPE_PRO_PRICE_ID || null;
}

export function getTeamPriceId(): string | null {
  return process.env.STRIPE_TEAM_PRICE_ID || null;
}

export function getTierByPriceId(priceId: string): TierName {
  if (priceId === getProPriceId()) return "pro";
  if (priceId === getTeamPriceId()) return "team";
  return "free";
}
