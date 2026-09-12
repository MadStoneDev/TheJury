import type { LucideIcon } from "lucide-react";

export type Accent = "emerald" | "gaming" | "teams" | "creators";

const TILE: Record<Accent, string> = {
  emerald: "bg-jury-emerald-tint text-jury-emerald",
  gaming: "bg-gaming/[0.14] text-gaming",
  teams: "bg-teams/[0.14] text-teams",
  creators: "bg-creators/[0.14] text-creators",
};

interface IconTileProps {
  icon: LucideIcon;
  accent?: Accent;
  /** Tailwind size classes for the square; defaults to the 42px desktop tile. */
  className?: string;
  iconSize?: number;
}

/**
 * A tinted rounded square holding a Lucide line icon — the redesign's standard
 * icon tile (features, templates, use-case pages). 42px desktop by default.
 */
export function IconTile({
  icon: Icon,
  accent = "emerald",
  className = "w-[42px] h-[42px]",
  iconSize = 20,
}: IconTileProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[10px] ${TILE[accent]} ${className}`}
    >
      <Icon size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
