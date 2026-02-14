"use client";

import { motion } from "motion/react";
import { IconStarFilled } from "@tabler/icons-react";
import type { RatingDistribution } from "@/lib/supabaseHelpers";

interface RatingScaleResultsProps {
  data: RatingDistribution;
}

export default function RatingScaleResults({ data }: RatingScaleResultsProps) {
  const { average, distribution, totalRatings, min, max } = data;
  const range: number[] = [];
  for (let i = max; i >= min; i--) range.push(i);

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-4">
      {/* Average */}
      <div className="flex items-center justify-center gap-3 py-3">
        <div className="flex items-center gap-1">
          <IconStarFilled className="w-7 h-7 text-amber-400" />
          <span className="text-3xl font-bold text-foreground">
            {average.toFixed(1)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>out of {max}</p>
          <p>
            {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="space-y-2">
        {range.map((n, i) => {
          const count = distribution[n] || 0;
          const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

          return (
            <div key={n} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-right font-medium text-foreground">
                {n}
              </span>
              <IconStarFilled className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className="h-full bg-amber-400/80 rounded-full"
                />
              </div>
              <span className="w-12 text-right text-muted-foreground tabular-nums">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
