"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { IconFlask, IconLoader2, IconTrophy } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";

interface VariantResult {
  id: string;
  name: string;
  questionText: string;
  voteCount: number;
  weight: number;
}

interface ABTestResultsProps {
  pollId: string;
}

export default function ABTestResults({ pollId }: ABTestResultsProps) {
  const [variants, setVariants] = useState<VariantResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAssignments, setTotalAssignments] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);

      // Get experiment for this poll
      const { data: experiment } = await supabase
        .from("ab_experiments")
        .select("id")
        .eq("poll_id", pollId)
        .single();

      if (!experiment) {
        setIsLoading(false);
        return;
      }

      // Get variants
      const { data: variantData } = await supabase
        .from("poll_variants")
        .select("id, name, question_text, weight")
        .eq("experiment_id", experiment.id)
        .order("created_at", { ascending: true });

      if (!variantData || variantData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get assignment counts per variant
      const { data: assignments } = await supabase
        .from("user_variant_assignments")
        .select("variant_id")
        .eq("experiment_id", experiment.id);

      const assignmentCounts: Record<string, number> = {};
      (assignments || []).forEach((a) => {
        assignmentCounts[a.variant_id] = (assignmentCounts[a.variant_id] || 0) + 1;
      });

      const total = Object.values(assignmentCounts).reduce((s, c) => s + c, 0);
      setTotalAssignments(total);

      setVariants(
        variantData.map((v) => ({
          id: v.id,
          name: v.name,
          questionText: v.question_text,
          voteCount: assignmentCounts[v.id] || 0,
          weight: v.weight,
        })),
      );

      setIsLoading(false);
    };

    loadResults();
  }, [pollId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  if (variants.length === 0) return null;

  const maxVotes = Math.max(...variants.map((v) => v.voteCount), 0);

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <IconFlask size={18} className="text-purple-400" />
        <h4 className="font-semibold text-foreground">A/B Test Results</h4>
        <span className="text-xs text-muted-foreground ml-auto">
          {totalAssignments} total assignments
        </span>
      </div>

      <div className="grid gap-3">
        {variants.map((variant) => {
          const pct = totalAssignments > 0
            ? Math.round((variant.voteCount / totalAssignments) * 100)
            : 0;
          const isWinner = variant.voteCount === maxVotes && maxVotes > 0;

          return (
            <motion.div
              key={variant.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                    {variant.name}
                  </span>
                  {isWinner && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      <IconTrophy size={10} />
                      Leading
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{pct}%</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({variant.voteCount})
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2 italic">
                &ldquo;{variant.questionText}&rdquo;
              </p>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                  className={`h-full rounded-full ${
                    isWinner ? "bg-emerald-500" : "bg-purple-500"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
