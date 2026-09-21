import type { Accent } from "./IconTile";

/** Eyebrow pill (uppercase kicker) classes per accent. */
export const EYEBROW: Record<Accent, string> = {
  emerald: "border-jury-emerald-line bg-jury-emerald-tint text-jury-emerald",
  churches: "border-churches/40 bg-churches/[0.12] text-churches-text",
  clubs: "border-clubs/40 bg-clubs/[0.12] text-clubs-text",
  councils: "border-councils/40 bg-councils/[0.12] text-councils-text",
  businesses: "border-businesses/40 bg-businesses/[0.12] text-businesses-text",
  presenters: "border-presenters/40 bg-presenters/[0.12] text-presenters-text",
  gaming: "border-gaming/40 bg-gaming/[0.12] text-gaming-text",
  teams: "border-teams/40 bg-teams/[0.12] text-teams-text",
  creators: "border-creators/40 bg-creators/[0.12] text-creators-text",
};

/** Filled pill button classes per accent. */
export const FILL_BTN: Record<Accent, string> = {
  emerald: "bg-jury-emerald text-jury-on-emerald hover:bg-jury-emerald-hi",
  churches: "bg-churches text-churches-on hover:brightness-110",
  clubs: "bg-clubs text-clubs-on hover:brightness-110",
  councils: "bg-councils text-councils-on hover:brightness-110",
  businesses: "bg-businesses text-businesses-on hover:brightness-110",
  presenters: "bg-presenters text-presenters-on hover:brightness-110",
  gaming: "bg-gaming text-gaming-on hover:brightness-110",
  teams: "bg-teams text-teams-on hover:brightness-110",
  creators: "bg-creators text-creators-on hover:brightness-110",
};

/** Check-icon / accent text colour per accent. */
export const ACCENT_TEXT: Record<Accent, string> = {
  emerald: "text-jury-emerald",
  churches: "text-churches",
  clubs: "text-clubs",
  councils: "text-councils",
  businesses: "text-businesses",
  presenters: "text-presenters",
  gaming: "text-gaming",
  teams: "text-teams",
  creators: "text-creators",
};
