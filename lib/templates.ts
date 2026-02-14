import type { TierName } from "./stripe";

export interface TemplateOption {
  text: string;
}

export interface TemplateQuestion {
  question_text: string;
  question_type: string;
  allow_multiple: boolean;
  settings: Record<string, unknown>;
  options: TemplateOption[];
}

export interface PollTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  minTier: TierName;
  icon: string;
  questions: TemplateQuestion[];
}

export type TemplateCategory =
  | "feedback"
  | "education"
  | "events"
  | "team"
  | "marketing"
  | "fun";

export const TEMPLATE_CATEGORIES: {
  value: TemplateCategory;
  label: string;
}[] = [
  { value: "feedback", label: "Feedback" },
  { value: "education", label: "Education" },
  { value: "events", label: "Events" },
  { value: "team", label: "Team" },
  { value: "marketing", label: "Marketing" },
  { value: "fun", label: "Fun" },
];

export const TEMPLATES: PollTemplate[] = [
  // --- FREE TEMPLATES ---
  {
    id: "customer-satisfaction",
    name: "Customer Satisfaction",
    description: "Measure how happy your customers are with your product or service",
    category: "feedback",
    minTier: "free",
    icon: "😊",
    questions: [
      {
        question_text: "How satisfied are you with our product/service?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Very Satisfied" },
          { text: "Satisfied" },
          { text: "Neutral" },
          { text: "Dissatisfied" },
          { text: "Very Dissatisfied" },
        ],
      },
    ],
  },
  {
    id: "team-lunch",
    name: "Team Lunch Poll",
    description: "Let your team vote on where to eat",
    category: "team",
    minTier: "free",
    icon: "🍽️",
    questions: [
      {
        question_text: "Where should we go for lunch today?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Pizza" },
          { text: "Sushi" },
          { text: "Burgers" },
          { text: "Salads" },
          { text: "Thai" },
        ],
      },
    ],
  },
  {
    id: "event-date",
    name: "Event Date Picker",
    description: "Find the best date for your next event",
    category: "events",
    minTier: "free",
    icon: "📅",
    questions: [
      {
        question_text: "Which date works best for you?",
        question_type: "multiple_choice",
        allow_multiple: true,
        settings: {},
        options: [
          { text: "Monday" },
          { text: "Tuesday" },
          { text: "Wednesday" },
          { text: "Thursday" },
          { text: "Friday" },
        ],
      },
    ],
  },
  {
    id: "quick-vote",
    name: "Quick Yes/No Vote",
    description: "Get a fast answer on any topic",
    category: "fun",
    minTier: "free",
    icon: "✅",
    questions: [
      {
        question_text: "Do you agree?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [{ text: "Yes" }, { text: "No" }, { text: "Maybe" }],
      },
    ],
  },

  // --- PRO TEMPLATES ---
  {
    id: "product-feedback-survey",
    name: "Product Feedback Survey",
    description: "Comprehensive product feedback with ratings and rankings",
    category: "feedback",
    minTier: "pro",
    icon: "📊",
    questions: [
      {
        question_text: "How would you rate our product overall?",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: { min: 1, max: 5, labels: { "1": "Poor", "5": "Excellent" } },
        options: [],
      },
      {
        question_text: "Which features are most important to you?",
        question_type: "ranked_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Ease of use" },
          { text: "Performance" },
          { text: "Design" },
          { text: "Price" },
          { text: "Support" },
        ],
      },
    ],
  },
  {
    id: "nps-survey",
    name: "NPS Survey",
    description: "Net Promoter Score — measure customer loyalty",
    category: "feedback",
    minTier: "pro",
    icon: "📈",
    questions: [
      {
        question_text:
          "How likely are you to recommend us to a friend? (1 = Not likely, 10 = Very likely)",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: { min: 1, max: 10, labels: { "1": "Not at all", "10": "Extremely likely" } },
        options: [],
      },
    ],
  },
  {
    id: "class-quiz",
    name: "Class Quiz",
    description: "Test knowledge with a multi-question quiz",
    category: "education",
    minTier: "pro",
    icon: "🎓",
    questions: [
      {
        question_text: "What is the capital of Australia?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Sydney" },
          { text: "Melbourne" },
          { text: "Canberra" },
          { text: "Brisbane" },
        ],
      },
      {
        question_text: "Which planet is closest to the sun?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Venus" },
          { text: "Mercury" },
          { text: "Earth" },
          { text: "Mars" },
        ],
      },
    ],
  },
  {
    id: "event-feedback",
    name: "Event Feedback",
    description: "Gather post-event feedback with ratings",
    category: "events",
    minTier: "pro",
    icon: "🎤",
    questions: [
      {
        question_text: "How would you rate the event overall?",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: { min: 1, max: 5, labels: { "1": "Poor", "5": "Excellent" } },
        options: [],
      },
      {
        question_text: "What did you enjoy most?",
        question_type: "multiple_choice",
        allow_multiple: true,
        settings: {},
        options: [
          { text: "Speakers" },
          { text: "Networking" },
          { text: "Content" },
          { text: "Venue" },
          { text: "Food & Drinks" },
        ],
      },
    ],
  },
  {
    id: "brand-preference",
    name: "Brand Preference",
    description: "Compare brand options with image-based voting",
    category: "marketing",
    minTier: "pro",
    icon: "🏷️",
    questions: [
      {
        question_text: "Which logo design do you prefer?",
        question_type: "image_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Option A" },
          { text: "Option B" },
          { text: "Option C" },
        ],
      },
    ],
  },

  // --- TEAM TEMPLATES ---
  {
    id: "employee-engagement",
    name: "Employee Engagement Survey",
    description: "Comprehensive workplace satisfaction survey",
    category: "team",
    minTier: "team",
    icon: "💼",
    questions: [
      {
        question_text: "How satisfied are you with your role?",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: { min: 1, max: 5, labels: { "1": "Very unsatisfied", "5": "Very satisfied" } },
        options: [],
      },
      {
        question_text: "What could we improve?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
      {
        question_text: "How do you feel about the team culture?",
        question_type: "reaction",
        allow_multiple: true,
        settings: { emojis: ["😀", "😐", "😢", "😡"] },
        options: [
          { text: "😀" },
          { text: "😐" },
          { text: "😢" },
          { text: "😡" },
        ],
      },
    ],
  },
  {
    id: "retrospective",
    name: "Sprint Retrospective",
    description: "Team retro — what went well, what to improve",
    category: "team",
    minTier: "team",
    icon: "🔄",
    questions: [
      {
        question_text: "How would you rate this sprint?",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: { min: 1, max: 5, labels: { "1": "Rough", "5": "Great" } },
        options: [],
      },
      {
        question_text: "What went well?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
      {
        question_text: "What should we improve?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
    ],
  },
  {
    id: "market-research",
    name: "Market Research Survey",
    description: "Comprehensive market research with multiple question types",
    category: "marketing",
    minTier: "team",
    icon: "🔍",
    questions: [
      {
        question_text: "How often do you use products like ours?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Daily" },
          { text: "Weekly" },
          { text: "Monthly" },
          { text: "Rarely" },
          { text: "Never" },
        ],
      },
      {
        question_text: "Rate these features by importance",
        question_type: "ranked_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Price" },
          { text: "Quality" },
          { text: "Speed" },
          { text: "Support" },
          { text: "Design" },
        ],
      },
      {
        question_text: "Any additional feedback?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
    ],
  },
];

export function getTemplateById(id: string): PollTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: TemplateCategory,
): PollTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}
