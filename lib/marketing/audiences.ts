import type { LucideIcon } from "lucide-react";
import { Church, Users, Landmark, Briefcase, Presentation } from "lucide-react";
import type { Accent } from "@/components/design/IconTile";

/**
 * The five audiences TheJury is marketed to, in priority order. Single source
 * of truth for the /for routes, the nav "Use cases" dropdown, the footer, the
 * homepage "Who uses TheJury" cards and each /for page's accent.
 *
 * Card copy is a concrete scenario, never a category label (per the content
 * brief): each card names a real situation the audience would recognise.
 */
export interface Audience {
  /** URL slug: /for/<slug> */
  slug: string;
  accent: Accent;
  icon: LucideIcon;
  /** Label used in the nav dropdown and footer. */
  navLabel: string;
  /** Homepage card heading (the audience). */
  cardTitle: string;
  /** Homepage card body — one concrete scenario, not a description. */
  cardBody: string;
  /** Homepage card link text. */
  cardLink: string;
}

export const AUDIENCES: Audience[] = [
  {
    slug: "churches",
    accent: "churches",
    icon: Church,
    navLabel: "Churches & ministries",
    cardTitle: "Churches",
    cardBody:
      "Put the building proposal to the congregation without a show of hands.",
    cardLink: "For churches →",
  },
  {
    slug: "clubs-and-associations",
    accent: "clubs",
    icon: Users,
    navLabel: "Clubs & associations",
    cardTitle: "Clubs & associations",
    cardBody:
      "Run an AGM motion and committee election with one private link per member.",
    cardLink: "For clubs & associations →",
  },
  {
    slug: "councils-and-government",
    accent: "councils",
    icon: Landmark,
    navLabel: "Councils & government",
    cardTitle: "Councils & government",
    cardBody:
      "Gather community feedback with a QR code at the drop-in session.",
    cardLink: "For councils & government →",
  },
  {
    slug: "businesses",
    accent: "businesses",
    icon: Briefcase,
    navLabel: "Businesses",
    cardTitle: "Businesses",
    cardBody:
      "Collect anonymous staff feedback without sending it to an overseas survey tool.",
    cardLink: "For businesses →",
  },
  {
    slug: "presenters",
    accent: "presenters",
    icon: Presentation,
    navLabel: "Presenters & trainers",
    cardTitle: "Presenters",
    cardBody:
      "Put a six-character code on screen and poll the room while you talk.",
    cardLink: "For presenters →",
  },
];

/** Look up an audience by slug (for per-page metadata/content wiring). */
export function getAudience(slug: string): Audience | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}

/**
 * Redirects from the retired gaming-era /for URLs to their nearest new home.
 * These old paths are live and indexed, so the 301s preserve inbound links and
 * search equity. Consumed by next.config redirects().
 */
export const LEGACY_FOR_REDIRECTS: { from: string; to: string }[] = [
  { from: "/for/gaming-groups", to: "/for/clubs-and-associations" },
  { from: "/for/teams", to: "/for/businesses" },
  { from: "/for/creators", to: "/for/presenters" },
];
