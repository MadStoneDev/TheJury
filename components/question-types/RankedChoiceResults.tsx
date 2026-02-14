"use client";

import { motion } from "motion/react";
import { IconTrophy } from "@tabler/icons-react";
import type { RankedOptionResult } from "@/lib/supabaseHelpers";

interface RankedChoiceResultsProps {
  data: RankedOptionResult[];
  totalVoters: number;
}

export default function RankedChoiceResults({
  data,
  totalVoters,
}: RankedChoiceResultsProps) {
  // Sort by average position (lowest = best)
  const sorted = [...data].sort((a, b) => a.avg_position - b.avg_position);
  const maxFirstPlace = Math.max(...sorted.map((d) => d.first_place_count), 1);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        {totalVoters} {totalVoters === 1 ? "voter" : "voters"} ranked these
        options
      </p>

      {sorted.map((item, i) => (
        <motion.div
          key={item.option_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`p-4 rounded-xl border ${
            i === 0
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i === 0
                  ? "bg-amber-500/20 text-amber-500"
                  : i === 1
                    ? "bg-slate-400/20 text-slate-400"
                    : i === 2
                      ? "bg-orange-600/20 text-orange-600"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {i === 0 ? (
                <IconTrophy className="w-4 h-4" />
              ) : (
                `#${i + 1}`
              )}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {item.option_text}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>
                  Avg position:{" "}
                  <strong className="text-foreground">
                    {item.avg_position.toFixed(1)}
                  </strong>
                </span>
                <span>
                  1st place:{" "}
                  <strong className="text-foreground">
                    {item.first_place_count}
                  </strong>
                </span>
              </div>
            </div>

            {/* First-place bar */}
            <div className="w-20 h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(item.first_place_count / maxFirstPlace) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="h-full bg-emerald-500/60 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
