"use client";

import { motion } from "motion/react";
import { IconTrophy } from "@tabler/icons-react";

export interface ChartDataItem {
  label: string;
  value: number;
  id: string;
}

interface BarChartProps {
  data: ChartDataItem[];
  total: number;
}

export default function BarChart({ data, total }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const isTop = item.value === maxValue && maxValue > 0;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`relative p-4 rounded-xl border overflow-hidden ${
              isTop
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-border"
            }`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, delay: index * 0.06, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
            />
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{item.label}</span>
                {isTop && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    <IconTrophy size={10} />
                    Leading
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-bold text-foreground">{percentage}%</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {item.value} {item.value === 1 ? "vote" : "votes"}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
