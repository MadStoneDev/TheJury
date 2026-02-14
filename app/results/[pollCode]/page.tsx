"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  IconUsers,
  IconChartBar,
  IconTrophy,
  IconLoader2,
} from "@tabler/icons-react";
import { getPollByCode, getPollResults } from "@/lib/supabaseHelpers";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function PublicResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        const pollWithSettings = pollData as Poll & {
          show_results_to_voters?: boolean;
        };
        if (pollWithSettings.show_results_to_voters === false) {
          setError("Results are not publicly available for this poll");
          return;
        }

        setPoll(pollData);

        const pollResults = await getPollResults(pollData.id);
        setResults(pollResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", pollData.id);

        setTotalVoters(voterCount || 0);
      } catch (err) {
        console.error("Error loading results:", err);
        setError("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [pollCode]);

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-2xl border bg-card p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-display text-foreground mb-2">
              {error === "Poll not found"
                ? "Not Found"
                : "Results Unavailable"}
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button variant="brand">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const maxVotes = Math.max(...results.map((r) => r.vote_count));

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Results Card */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-lg">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <IconChartBar size={20} className="text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Poll Results
                  </span>
                </div>
                <h1 className="text-2xl font-display text-foreground mb-2">
                  {poll.question}
                </h1>
                {poll.description && (
                  <p className="text-muted-foreground text-sm">
                    {poll.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-muted-foreground">
                  <IconUsers size={14} />
                  <span>
                    {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
                  </span>
                </div>
              </div>

              {/* Results */}
              {totalVoters === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <IconChartBar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No votes yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, i) => {
                    const percentage = getPercentage(result.vote_count);
                    const isTopChoice =
                      result.vote_count === maxVotes && maxVotes > 0;

                    return (
                      <motion.div
                        key={result.option_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative p-4 rounded-xl border overflow-hidden ${
                          isTopChoice
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-border"
                        }`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.08,
                            ease: "easeOut",
                          }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
                        />

                        <div className="relative flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {result.option_text}
                            </span>
                            {isTopChoice && (
                              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <IconTrophy size={10} />
                                Leading
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground">
                              {percentage}%
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {result.vote_count}{" "}
                              {result.vote_count === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vote CTA */}
          <div className="text-center mt-6 space-y-3">
            <Link href={`/answer/${pollCode}`}>
              <Button variant="brand" size="lg">
                Vote on this poll
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <Link
                href="/"
                className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
              >
                TheJury
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
