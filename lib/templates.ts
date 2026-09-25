import type { TierName } from "./stripe";

// Poll templates for the Australian-org audience. Each carries an `audience`
// tag and a one-line description that states the default settings, since the
// poll schema itself doesn't model "anonymous"/"verified" — the person sets
// those in the create flow.
//
// CLAIM-FLAG (verified-voting): templates described as a formal vote (AGM
// motion, elections, congregational vote, circular resolution) create an
// ordinary poll today. Verified one-link-per-member voting is not built yet;
// see /security. Do not imply the poll is verified until it ships.

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
  /** Display-only audience tag (e.g. "Churches", "Councils & government"). */
  audience: string;
  minTier: TierName;
  icon: string;
  questions: TemplateQuestion[];
}

export type TemplateCategory =
  | "governance"
  | "consultation"
  | "feedback"
  | "events"
  | "live";

export const TEMPLATE_CATEGORIES: {
  value: TemplateCategory;
  label: string;
}[] = [
  { value: "governance", label: "Motions & elections" },
  { value: "consultation", label: "Consultation" },
  { value: "feedback", label: "Feedback" },
  { value: "events", label: "Dates & events" },
  { value: "live", label: "Live sessions" },
];

const RATING_1_5 = (low: string, high: string) => ({
  min: 1,
  max: 5,
  labels: { 1: low, 5: high },
});

export const TEMPLATES: PollTemplate[] = [
  // --- MOTIONS & ELECTIONS ---
  {
    id: "agm-motion",
    name: "AGM motion",
    description:
      "Put a motion to the members. For, against or abstain, with a clear record for the minutes.",
    category: "governance",
    audience: "Clubs & associations",
    minTier: "pro",
    icon: "gavel",
    questions: [
      {
        question_text: "That the motion be carried.",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [{ text: "For" }, { text: "Against" }, { text: "Abstain" }],
      },
    ],
  },
  {
    id: "committee-election",
    name: "Committee or board election",
    description:
      "Run an election for the committee or board. Members choose up to the number of vacancies.",
    category: "governance",
    audience: "Clubs & associations",
    minTier: "pro",
    icon: "users",
    questions: [
      {
        question_text: "Elect your committee (choose up to three).",
        question_type: "multiple_choice",
        allow_multiple: true,
        settings: { maxChoices: 3 },
        options: [
          { text: "Karen Nguyen" },
          { text: "Dave Mitchell" },
          { text: "Priya Sharma" },
          { text: "Tom Kelly" },
          { text: "Fiona Papadopoulos" },
        ],
      },
    ],
  },
  {
    id: "congregational-vote",
    name: "Congregational vote on a proposal",
    description:
      "Put a building or budget proposal to the congregation. Yes, no or abstain.",
    category: "governance",
    audience: "Churches",
    minTier: "pro",
    icon: "church",
    questions: [
      {
        question_text: "Adopt the proposal?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [{ text: "Yes" }, { text: "No" }, { text: "Abstain" }],
      },
    ],
  },
  {
    id: "circular-resolution",
    name: "Board circular resolution",
    description:
      "A circular resolution between meetings. Yes or no, with a close time you set.",
    category: "governance",
    audience: "Clubs & associations",
    minTier: "pro",
    icon: "clipboard",
    questions: [
      {
        question_text: "That the resolution be passed.",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [{ text: "Yes" }, { text: "No" }],
      },
    ],
  },

  // --- CONSULTATION ---
  {
    id: "rule-change-consultation",
    name: "Member consultation on a rule change",
    description:
      "Test a rule change before you table it. Agree, disagree or unsure, plus a comment box. Anonymous.",
    category: "consultation",
    audience: "Clubs & associations",
    minTier: "pro",
    icon: "message-square",
    questions: [
      {
        question_text: "How do you feel about the proposed rule change?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Agree" },
          { text: "Disagree" },
          { text: "Unsure" },
        ],
      },
      {
        question_text: "Anything you'd like the committee to consider?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
    ],
  },
  {
    id: "community-consultation",
    name: "Community consultation",
    description:
      "Ask residents which priorities matter most. Tick all that apply, no account needed.",
    category: "consultation",
    audience: "Councils & government",
    minTier: "free",
    icon: "landmark",
    questions: [
      {
        question_text: "Which priorities matter most to you? (tick all that apply)",
        question_type: "multiple_choice",
        allow_multiple: true,
        settings: {},
        options: [
          { text: "Parks and open space" },
          { text: "Roads and footpaths" },
          { text: "Waste and recycling" },
          { text: "Community events" },
          { text: "Public transport" },
        ],
      },
    ],
  },

  // --- FEEDBACK ---
  {
    id: "staff-feedback",
    name: "Anonymous staff feedback",
    description:
      "An anonymous staff pulse check. A few statements, each rated one to five.",
    category: "feedback",
    audience: "Businesses",
    minTier: "pro",
    icon: "bar-chart",
    questions: [
      {
        question_text: "I have what I need to do my job well.",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: RATING_1_5("Strongly disagree", "Strongly agree"),
        options: [],
      },
      {
        question_text: "I feel heard by management.",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: RATING_1_5("Strongly disagree", "Strongly agree"),
        options: [],
      },
      {
        question_text: "I would recommend this as a place to work.",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: RATING_1_5("Strongly disagree", "Strongly agree"),
        options: [],
      },
    ],
  },
  {
    id: "client-satisfaction",
    name: "Client or patient satisfaction",
    description:
      "A quick rating after an appointment, with one optional comment. Anonymous.",
    category: "feedback",
    audience: "Businesses",
    minTier: "pro",
    icon: "star",
    questions: [
      {
        question_text: "How was your experience today?",
        question_type: "rating_scale",
        allow_multiple: false,
        settings: RATING_1_5("Poor", "Excellent"),
        options: [],
      },
      {
        question_text: "Anything we could do better?",
        question_type: "open_ended",
        allow_multiple: false,
        settings: {},
        options: [],
      },
    ],
  },

  // --- DATES & EVENTS ---
  {
    id: "find-a-date",
    name: "Find a meeting or event date",
    description:
      "Find a date that suits the most people. Tick every option that works.",
    category: "events",
    audience: "Any organisation",
    minTier: "free",
    icon: "calendar",
    questions: [
      {
        question_text: "Which dates can you make? (tick all that work)",
        question_type: "multiple_choice",
        allow_multiple: true,
        settings: {},
        options: [
          { text: "Saturday 4 October" },
          { text: "Sunday 5 October" },
          { text: "Saturday 11 October" },
          { text: "Sunday 12 October" },
        ],
      },
    ],
  },

  // --- LIVE SESSIONS ---
  {
    id: "session-check-in",
    name: "Live session check-in",
    description:
      "A quick check-in during a live session. One tap from the room.",
    category: "live",
    audience: "Presenters",
    minTier: "free",
    icon: "presentation",
    questions: [
      {
        question_text: "How are you finding the session so far?",
        question_type: "multiple_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Following along" },
          { text: "A bit lost" },
          { text: "Too slow" },
          { text: "Just right" },
        ],
      },
    ],
  },
  {
    id: "which-topic-next",
    name: "Training workshop: which topic next",
    description:
      "Let the room rank what to cover next. Ranked choice settles it.",
    category: "live",
    audience: "Presenters",
    minTier: "pro",
    icon: "list-checks",
    questions: [
      {
        question_text: "Which topic should we cover next?",
        question_type: "ranked_choice",
        allow_multiple: false,
        settings: {},
        options: [
          { text: "Worked examples" },
          { text: "A live demo" },
          { text: "Common mistakes" },
          { text: "Questions and discussion" },
        ],
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
