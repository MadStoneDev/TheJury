"use client";

import { motion } from "motion/react";
import type { PollResult } from "@/lib/supabaseHelpers";

interface ReactionPollResultsProps {
  results: PollResult[];
  totalVoters: number;
}

export default function ReactionPollResults({
  results,
  totalVoters,
}: ReactionPollResultsProps) {
  const maxVotes = Math.max(...results.map((r) => r.vote_count), 1);

  // Sort by votes descending
  const sorted = [...results].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {sorted.map((result, i) => {
          const pct =
            totalVoters > 0
              ? Math.round((result.vote_count / totalVoters) * 100)
              : 0;
          const barHeight = (result.vote_count / maxVotes) * 100;

          return (
            <motion.div
              key={result.option_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-1"
            >
              {/* Bar */}
              <div className="w-14 h-24 bg-muted rounded-lg overflow-hidden flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="w-full bg-emerald-500/40 rounded-t-lg"
                />
              </div>

              {/* Emoji */}
              <span className="text-2xl">{result.option_text}</span>

              {/* Count and percentage */}
              <span className="text-xs font-medium text-foreground">
                {result.vote_count}
              </span>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
