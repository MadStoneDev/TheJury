"use client";

import { IconChartBar, IconChartPie, IconChartDonut, IconLock } from "@tabler/icons-react";
import { canUseFeature } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";

export type ChartType = "bar" | "pie" | "donut";

interface ChartSelectorProps {
  selected: ChartType;
  onChange: (type: ChartType) => void;
  userTier: TierName;
  onUpgradeRequest: () => void;
}

const CHART_OPTIONS: { type: ChartType; label: string; icon: typeof IconChartBar }[] = [
  { type: "bar", label: "Bar", icon: IconChartBar },
  { type: "pie", label: "Pie", icon: IconChartPie },
  { type: "donut", label: "Donut", icon: IconChartDonut },
];

export default function ChartSelector({
  selected,
  onChange,
  userTier,
  onUpgradeRequest,
}: ChartSelectorProps) {
  const hasChartTypes = canUseFeature(userTier, "chartTypes");

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
      {CHART_OPTIONS.map(({ type, label, icon: Icon }) => {
        const isLocked = type !== "bar" && !hasChartTypes;
        const isSelected = selected === type;

        return (
          <button
            key={type}
            onClick={() => {
              if (isLocked) {
                onUpgradeRequest();
                return;
              }
              onChange(type);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isLocked ? "Upgrade to Pro for more chart types" : label}
          >
            <Icon size={14} />
            {label}
            {isLocked && <IconLock size={10} className="text-muted-foreground" />}
          </button>
        );
      })}
    </div>
  );
}
