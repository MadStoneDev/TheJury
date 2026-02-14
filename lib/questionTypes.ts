import type { TierName } from "./stripe";
import type { Feature } from "./featureGate";

export type QuestionType =
  | "multiple_choice"
  | "rating_scale"
  | "ranked_choice"
  | "image_choice"
  | "open_ended"
  | "reaction";

export interface QuestionTypeDefinition {
  value: QuestionType;
  label: string;
  description: string;
  minTier: TierName;
  featureKey: Feature | null; // null = free for all
  hasOptions: boolean; // whether this type uses poll_options
}

export const QUESTION_TYPES: QuestionTypeDefinition[] = [
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Voters pick one or more options",
    minTier: "free",
    featureKey: null,
    hasOptions: true,
  },
  {
    value: "rating_scale",
    label: "Rating Scale",
    description: "Rate on a numeric scale (e.g. 1–5 stars)",
    minTier: "pro",
    featureKey: "ratingScale",
    hasOptions: false,
  },
  {
    value: "ranked_choice",
    label: "Ranked Choice",
    description: "Drag to rank options in order of preference",
    minTier: "pro",
    featureKey: "rankedChoice",
    hasOptions: true,
  },
  {
    value: "image_choice",
    label: "Image Options",
    description: "Choose from options with images",
    minTier: "pro",
    featureKey: "imageOptions",
    hasOptions: true,
  },
  {
    value: "open_ended",
    label: "Open Ended",
    description: "Free text response from voters",
    minTier: "team",
    featureKey: "openEnded",
    hasOptions: false,
  },
  {
    value: "reaction",
    label: "Reaction Poll",
    description: "React with emojis for quick feedback",
    minTier: "team",
    featureKey: "reactionPolls",
    hasOptions: true,
  },
];

export function getQuestionType(type: string): QuestionTypeDefinition | undefined {
  return QUESTION_TYPES.find((qt) => qt.value === type);
}

export function questionTypeHasOptions(type: string): boolean {
  const qt = getQuestionType(type);
  return qt?.hasOptions ?? true;
}

/** Default settings for each question type */
export function getDefaultSettings(type: QuestionType): Record<string, unknown> {
  switch (type) {
    case "rating_scale":
      return { min: 1, max: 5, labels: { 1: "Poor", 5: "Excellent" } };
    case "reaction":
      return { emojis: ["👍", "👎", "❤️", "😂", "😮", "😢"] };
    default:
      return {};
  }
}

/** Popular emoji sets for reaction polls */
export const EMOJI_PRESETS = {
  thumbs: ["👍", "👎"],
  faces: ["😀", "😐", "😢", "😡"],
  reactions: ["👍", "👎", "❤️", "😂", "😮", "😢"],
  ratings: ["⭐", "🌟", "💫", "✨", "🔥"],
  food: ["🍕", "🍔", "🌮", "🍣", "🥗", "🍜"],
};
