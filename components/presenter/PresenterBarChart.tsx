"use client";

import { motion } from "motion/react";
import { IconTrophy } from "@tabler/icons-react";
import type { ChartDataItem } from "@/components/charts";

interface PresenterBarChartProps {
  data: ChartDataItem[];
  total: number;
}

export default function PresenterBarChart({ data, total }: PresenterBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const isTop = item.value === maxValue && maxValue > 0;

        return (
          <div key={item.id} className="relative">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold text-white">
                  {item.label}
                </span>
                {isTop && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <IconTrophy size={14} />
                    Leading
                  </span>
                )}
              </div>
              <div className="text-right flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white tabular-nums">
                  {percentage}%
                </span>
                <span className="text-lg text-white/60">
                  {item.value} {item.value === 1 ? "vote" : "votes"}
                </span>
              </div>
            </div>
            <div className="h-16 bg-white/5 rounded-xl overflow-hidden">
              <motion.div
                className={`h-full rounded-xl ${
                  isTop
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-white/20 to-white/10"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
