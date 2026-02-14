// answer/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import {
  getPollByCode,
  submitVote,
  hasUserVoted,
  getUserVotes,
  getPollResults,
  getCurrentUser,
  generateFingerprint,
} from "@/lib/supabaseHelpers";
import { toast } from "sonner";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function PollAnswerPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVotedFlag, setHasVotedFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVotedFor, setJustVotedFor] = useState<string[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    const loadPoll = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        if (!pollData.is_active) {
          setError("This poll is not currently active");
          return;
        }

        if (pollData.has_time_limit) {
          const now = new Date();
          if (pollData.start_date && new Date(pollData.start_date) > now) {
            setError("Voting has not started yet");
            return;
          }
          if (pollData.end_date && new Date(pollData.end_date) < now) {
            setError("Voting has ended");
            return;
          }
        }

        setPoll(pollData);

        const pollResults = await getPollResults(pollData.id);
        setResults(pollResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", pollData.id);

        setTotalVoters(voterCount || 0);

        const user = await getCurrentUser();
        let voted = false;
        let userVotes: string[] = [];

        if (user) {
          voted = await hasUserVoted(pollData.id, user.id);
          if (voted) {
            userVotes = await getUserVotes(pollData.id, user.id);
          }
        } else {
          try {
            const fingerprint = generateFingerprint();
            voted = await hasUserVoted(pollData.id, undefined, fingerprint);
            if (voted) {
              userVotes = await getUserVotes(
                pollData.id,
                undefined,
                fingerprint,
              );
            }
          } catch (err) {
            console.warn("Could not check anonymous voting status:", err);
          }
        }

        setHasVotedFlag(voted);
        if (voted) {
          setJustVotedFor(userVotes);
        }
      } catch (err) {
        console.error("Error loading poll:", err);
        setError("Failed to load poll");
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollCode]);

  const handleOptionToggle = (optionId: string) => {
    if (poll?.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#10b981", "#14b8a6", "#34d399", "#6ee7b7"],
    });
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !poll) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      let success = false;

      if (user) {
        await submitVote(poll.id, selectedOptions, user.id);
        success = true;
      } else {
        const fingerprint = generateFingerprint();
        await submitVote(
          poll.id,
          selectedOptions,
          undefined,
          undefined,
          fingerprint,
        );
        success = true;
      }

      if (success) {
        const pollResults = await getPollResults(poll.id);
        setResults(pollResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id);

        setTotalVoters(voterCount || 0);

        setJustVotedFor([...selectedOptions]);
        setHasVotedFlag(true);
        fireConfetti();
        toast.success("Vote submitted!");
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Failed to submit vote. Please try again.");
        toast.error("Failed to submit vote. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-2xl border bg-card p-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-display text-foreground mb-2">
              Oops!
            </h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-xs text-muted-foreground mb-6">
              Poll code:{" "}
              <span className="font-mono bg-muted px-2 py-1 rounded">
                {pollCode}
              </span>
            </p>
            <Link href="/">
              <Button variant="brand">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Poll Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-card shadow-xl shadow-emerald-500/5 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block text-xs text-muted-foreground font-mono bg-muted px-3 py-1 rounded-full mb-4">
                {pollCode}
              </span>
              <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-2">
                {poll.question}
              </h1>
              {poll.description && (
                <p className="text-muted-foreground">{poll.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                {totalVoters} {totalVoters === 1 ? "person has" : "people have"}{" "}
                voted so far
              </p>
            </div>

            <AnimatePresence mode="wait">
              {hasVotedFlag ? (
                /* Results View */
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3"
                    >
                      <IconCheck className="w-7 h-7 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Thanks for voting!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Here are the current results:
                    </p>
                  </div>

                  {results.map((result, i) => {
                    const percentage = getPercentage(result.vote_count);
                    const isJustVotedFor = justVotedFor.includes(
                      result.option_id,
                    );

                    return (
                      <motion.div
                        key={result.option_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative p-4 rounded-xl border overflow-hidden ${
                          isJustVotedFor
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
                            {isJustVotedFor && (
                              <IconCheck className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="font-medium text-foreground">
                              {result.option_text}
                            </span>
                            {isJustVotedFor && (
                              <span className="text-xs text-emerald-500 font-medium">
                                Your vote
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
                </motion.div>
              ) : (
                /* Voting View */
                <motion.div
                  key="voting"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    {poll.allow_multiple
                      ? "Select all that apply:"
                      : "Choose one option:"}
                  </p>

                  {poll.options?.map((option) => {
                    const isSelected = selectedOptions.includes(option.id);
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleOptionToggle(option.id)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <IconCheck className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </div>
                          <span className="font-medium text-foreground">
                            {option.text}
                          </span>
                        </div>
                      </motion.button>
                    );
                  }) || (
                    <div className="text-center text-muted-foreground">
                      No options available
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleVote}
                      disabled={selectedOptions.length === 0 || isSubmitting}
                      variant="brand"
                      size="xl"
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <IconLoader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Cast Your Vote"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
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
