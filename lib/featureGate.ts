import { TIERS, type TierName, type TierConfig } from "./stripe";

export type Feature = keyof Omit<
  TierConfig,
  "name" | "priceId" | "priceIdAnnual" | "priceMonthly" | "priceAnnualMonthly" | "priceAnnualTotal"
>;

export type LimitFeature = "maxActivePolls" | "maxQuestionsPerPoll";

/**
 * Check if a tier has access to a feature.
 * For numeric limits (maxActivePolls, maxQuestionsPerPoll), returns true if limit > 0.
 * For boolean features, returns the boolean value directly.
 */
export function canUseFeature(tier: TierName, feature: Feature): boolean {
  const config = TIERS[tier] || TIERS.free;
  const value = config[feature];

  if (typeof value === "number") {
    // -1 means unlimited, any positive number means allowed
    return value !== 0;
  }

  return !!value;
}

/**
 * Get the numeric limit for a feature.
 * Returns -1 for unlimited, or the actual limit number.
 */
export function getFeatureLimit(tier: TierName, feature: LimitFeature): number {
  const config = TIERS[tier] || TIERS.free;
  return config[feature];
}

/**
 * Returns the minimum tier needed to unlock a feature.
 * Returns null if all tiers have it (shouldn't gate).
 */
export function getUpgradeTarget(
  currentTier: TierName,
  feature: Feature,
): TierName | null {
  const tierOrder: TierName[] = ["free", "pro", "team"];
  const currentIndex = tierOrder.indexOf(currentTier);

  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const tier = tierOrder[i];
    if (canUseFeature(tier, feature)) {
      return tier;
    }
  }

  return null;
}

/**
 * Human-readable feature names for display in the upgrade modal.
 */
export const FEATURE_LABELS: Record<Feature, string> = {
  maxActivePolls: "More Active Polls",
  maxQuestionsPerPoll: "More Questions per Poll",
  removeBranding: "Remove Branding",
  csvExport: "CSV Export",
  qrCodes: "QR Codes",
  scheduling: "Poll Scheduling",
  ratingScale: "Rating Scale Questions",
  rankedChoice: "Ranked-Choice Questions",
  imageOptions: "Image Options",
  openEnded: "Open-Ended Questions",
  reactionPolls: "Reaction Polls",
  templates: "Poll Templates",
  aiGeneration: "AI Poll Generation",
  passwordProtect: "Password Protection",
  customEmbedThemes: "Custom Embed Themes",
  chartTypes: "Multiple Chart Types",
  customLogoEmbed: "Custom Logo on Embeds",
  advancedAnalytics: "Advanced Analytics",
  webhooks: "Webhooks",
  customDomains: "Custom Domains",
  teamWorkspace: "Team Workspace",
  abTesting: "A/B Testing",
  apiAccess: "API Access",
};

/**
 * Short descriptions for the upgrade modal to explain value of each feature.
 */
export const FEATURE_DESCRIPTIONS: Record<Feature, string> = {
  maxActivePolls: "Run more polls at the same time to gather feedback across multiple topics.",
  maxQuestionsPerPoll: "Add unlimited questions to your polls for comprehensive surveys.",
  removeBranding: "Present a professional look by removing TheJury branding from your polls.",
  csvExport: "Export poll results to CSV for analysis in spreadsheets and other tools.",
  qrCodes: "Generate QR codes to make it easy for people to vote on your polls.",
  scheduling: "Schedule polls to automatically start and end at specific times.",
  ratingScale: "Let voters rate items on a numeric scale for more nuanced feedback.",
  rankedChoice: "Allow voters to rank options in order of preference.",
  imageOptions: "Add images to your poll options for visual polls.",
  openEnded: "Collect free-text responses and visualise them as word clouds.",
  reactionPolls: "Let voters react with emojis for quick, expressive feedback.",
  templates: "Start from pre-built templates to create polls faster.",
  aiGeneration: "Use AI to instantly generate poll questions and options.",
  passwordProtect: "Restrict access to your polls with a password.",
  customEmbedThemes: "Customise the look of embedded polls to match your brand.",
  chartTypes: "Visualise results with pie charts, donut charts, and more.",
  customLogoEmbed: "Replace TheJury branding with your own logo on embeds.",
  advancedAnalytics: "Get deeper insights with response timing, completion rates, and heatmaps.",
  webhooks: "Receive real-time notifications when people vote on your polls.",
  customDomains: "Use your own domain for poll links.",
  teamWorkspace: "Collaborate with your team on polls in a shared workspace.",
  abTesting: "Test different poll variants to optimise engagement.",
  apiAccess: "Integrate polls into your own applications with our API.",
};
