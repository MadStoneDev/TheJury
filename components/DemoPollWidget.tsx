"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
// canvas-confetti is dynamically imported at call site for bundle optimization
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { generateFingerprint } from "@/lib/supabaseHelpers";
import { safeJsonParse } from "@/lib/jsonUtils";

interface LivePoll {
  id: string;
  question: string;
  description: string | null;
  options: Array<{ id: string; text: string }>;
  category: string | null;
  is_active: boolean | null;
}

interface LivePollResult {
  option_id: string;
  option_text: string;
  vote_count: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const livePollAPI = {
  async getRandomLivePoll(): Promise<LivePoll> {
    const response = await fetch("/api/live-polls/random");
    if (!response.ok) throw new Error("Failed to fetch live poll");
    return response.json();
  },

  async getLivePollResults(pollId: string): Promise<LivePollResult[]> {
    const response = await fetch(`/api/live-polls/${pollId}/results`);
    if (!response.ok) throw new Error("Failed to fetch results");
    return response.json();
  },

  async submitLiveVote(
    pollId: string,
    selectedOptions: string[],
    voterFingerprint: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch("/api/live-polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demo_poll_id: pollId,
        selected_options: selectedOptions,
        voter_fingerprint: voterFingerprint,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit vote");
    }
    return response.json();
  },

  async hasVoted(pollId: string, voterFingerprint: string): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/live-polls/${pollId}/has-voted?fingerprint=${voterFingerprint}`,
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.hasVoted;
    } catch {
      return false;
    }
  },
};

const DemoPollWidget: React.FC = () => {
  const [demoPoll, setDemoPoll] = useState<LivePoll | null>(null);
  const [results, setResults] = useState<LivePollResult[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voterFingerprint, setVoterFingerprint] = useState("");

  useEffect(() => {
    setVoterFingerprint(generateFingerprint());
  }, []);

  const loadDemoPoll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const poll = await livePollAPI.getRandomLivePoll();
      setDemoPoll(poll);
      const voted = await livePollAPI.hasVoted(poll.id, voterFingerprint);
      setHasVoted(voted);
      const pollResults = await livePollAPI.getLivePollResults(poll.id);
      setResults(pollResults || []);
    } catch (err) {
      console.error("Error loading live poll:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load live poll",
      );
    } finally {
      setIsLoading(false);
    }
  }, [voterFingerprint]);

  useEffect(() => {
    if (!voterFingerprint) return;
    loadDemoPoll();
  }, [voterFingerprint, loadDemoPoll]);

  const fireConfetti = async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#10b981", "#14b8a6", "#34d399", "#6ee7b7"],
    });
  };

  const handleVote = async (optionId: string) => {
    if (hasVoted || isVoting || !optionId || !demoPoll) return;
    try {
      setIsVoting(true);
      setError(null);
      await livePollAPI.submitLiveVote(
        demoPoll.id,
        [optionId],
        voterFingerprint,
      );
      setSelectedOption(optionId);
      setHasVoted(true);
      fireConfetti();
      try {
        const pollResults = await livePollAPI.getLivePollResults(demoPoll.id);
        setResults(pollResults || []);
      } catch {
        setError("Vote submitted! Results will update on refresh.");
      }
    } catch (err) {
      console.error("Error voting:", err);
      setError(err instanceof Error ? err.message : "Failed to submit vote");
      setHasVoted(false);
      setSelectedOption(null);
    } finally {
      setIsVoting(false);
    }
  };

  const tryNewPoll = async () => {
    setHasVoted(false);
    setSelectedOption(null);
    setResults([]);
    await loadDemoPoll();
  };

  const totalVotes = results.reduce((sum, r) => sum + (r.vote_count || 0), 0);
  const getPercentage = (votes: number) =>
    totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  // Card wrapper styles
  const cardClass =
    "rounded-2xl border border-emerald-500/20 bg-card shadow-xl shadow-emerald-500/5 p-6 sm:p-8";

  if (isLoading) {
    return (
      <div className={cardClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconLoader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Loading live poll...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !demoPoll) {
    return (
      <div className={cardClass}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <button
            onClick={loadDemoPoll}
            className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!demoPoll) {
    return (
      <div className={cardClass}>
        <div className="text-center text-muted-foreground py-8">
          No live polls available
        </div>
      </div>
    );
  }

  const options: Array<{ id: string; text: string }> = safeJsonParse(
    demoPoll.options,
    [],
  );

  if (!options.length) {
    return (
      <div className={cardClass}>
        <div className="text-center text-muted-foreground py-8">
          No poll options available
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Poll
        </span>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {demoPoll.question}
        </h3>
        {demoPoll.description && (
          <p className="text-sm text-muted-foreground">
            {demoPoll.description}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!hasVoted ? (
          <motion.div
            key="voting"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {options.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleVote(option.id)}
                disabled={isVoting}
                className="w-full p-3.5 text-left rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-emerald-500 transition-colors shrink-0" />
                  <span className="font-medium text-foreground text-sm">
                    {option.text}
                  </span>
                </div>
              </motion.button>
            ))}

            {isVoting && (
              <div className="text-center text-emerald-500 text-sm font-medium pt-2">
                <IconLoader2 className="w-4 h-4 animate-spin inline mr-1.5" />
                Submitting vote...
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-500 font-medium text-sm mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
              >
                <IconCheck className="w-5 h-5" />
              </motion.div>
              Thanks for voting!
            </div>

            {results.map((result, i) => {
              const percentage = getPercentage(result.vote_count);
              const isSelected = result.option_id === selectedOption;

              return (
                <motion.div
                  key={result.option_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-3 rounded-xl border overflow-hidden ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border"
                  }`}
                >
                  {/* Progress bar background */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
                  />

                  <div className="relative flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span className="font-medium text-foreground text-sm">
                        {result.option_text}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground text-sm">
                        {percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({result.vote_count})
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="text-center pt-3">
              <button
                onClick={tryNewPoll}
                className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors"
              >
                Try another poll &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && demoPoll && (
        <p className="text-xs text-destructive text-center mt-3">{error}</p>
      )}

      <div className="text-center mt-5 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Total votes: {totalVotes} &bull; Live poll with real data
        </p>
      </div>
    </div>
  );
};

export default DemoPollWidget;
