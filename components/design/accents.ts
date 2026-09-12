import type { Accent } from "./IconTile";

/** Eyebrow pill (uppercase kicker) classes per accent. */
export const EYEBROW: Record<Accent, string> = {
  emerald: "border-jury-emerald-line bg-jury-emerald-tint text-jury-emerald",
  gaming: "border-gaming/40 bg-gaming/[0.12] text-gaming-text",
  teams: "border-teams/40 bg-teams/[0.12] text-teams-text",
  creators: "border-creators/40 bg-creators/[0.12] text-creators-text",
};

/** Filled pill button classes per accent. */
export const FILL_BTN: Record<Accent, string> = {
  emerald: "bg-jury-emerald text-jury-on-emerald hover:bg-jury-emerald-hi",
  gaming: "bg-gaming text-gaming-on hover:brightness-110",
  teams: "bg-teams text-teams-on hover:brightness-110",
  creators: "bg-creators text-creators-on hover:brightness-110",
};

/** Check-icon / accent text colour per accent. */
export const ACCENT_TEXT: Record<Accent, string> = {
  emerald: "text-jury-emerald",
  gaming: "text-gaming",
  teams: "text-teams",
  creators: "text-creators",
};
