// answer/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  IconCheck,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  getPollByCode,
  submitVote,
  hasUserVoted,
  getUserVotes,
  getPollResultsByQuestion,
  getCurrentUser,
  generateFingerprint,
  getABExperiment,
  assignVariant,
} from "@/lib/supabaseHelpers";
import type { ABVariantData } from "@/lib/supabaseHelpers";
import { toast } from "sonner";
import type {
  Poll,
  PollQuestion,
  PollResult,
  QuestionResult,
} from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { QuestionTypeInput, QuestionTypeResults } from "@/components/question-types";
import PasswordGate from "@/components/PasswordGate";

export default function PollAnswerPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [questionSelections, setQuestionSelections] = useState<
    Record<string, string[]>
  >({});
  const [answerData, setAnswerData] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasVotedFlag, setHasVotedFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVotedFor, setJustVotedFor] = useState<string[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [abVariant, setAbVariant] = useState<ABVariantData | null>(null);

  // Build questions array — use poll.questions if available, else synthesize from poll.options
  const questions: PollQuestion[] =
    poll?.questions && poll.questions.length > 0
      ? poll.questions
      : poll?.options
        ? [
            {
              id: "_legacy",
              poll_id: poll.id,
              question_text: poll.question,
              question_type: "multiple_choice",
              question_order: 1,
              allow_multiple: poll.allow_multiple,
              settings: {},
              options: poll.options,
            },
          ]
        : [];

  const isMultiQuestion = questions.length > 1;
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    const loadPoll = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setLoadError("Poll not found");
          return;
        }

        if (!pollData.is_active) {
          setLoadError("This poll is not currently active");
          return;
        }

        if (pollData.has_time_limit) {
          const now = new Date();
          if (pollData.start_date && new Date(pollData.start_date) > now) {
            const diff = new Date(pollData.start_date).getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const timeStr = days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : `${hours} hour${hours !== 1 ? "s" : ""}`;
            setLoadError(`This poll opens in ${timeStr}. Check back soon!`);
            return;
          }
          if (pollData.end_date && new Date(pollData.end_date) < now) {
            setLoadError("Voting for this poll has ended");
            return;
          }
        }

        setPoll(pollData);

        // Check for A/B experiment
        const abExp = await getABExperiment(pollData.id);
        if (abExp && abExp.variants.length >= 2) {
          const user = await getCurrentUser();
          const fp = !user ? generateFingerprint() : undefined;
          const assigned = await assignVariant(
            abExp.experiment.id,
            abExp.variants,
            user?.id,
            fp,
          );
          if (assigned) {
            setAbVariant(assigned);
          }
        }

        const qResults = await getPollResultsByQuestion(pollData.id);
        setQuestionResults(qResults);

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
        setLoadError("Failed to load poll");
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollCode]);

  const handleOptionToggle = (optionId: string) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const currentSelected = questionSelections[questionId] || [];

    if (currentQuestion.allow_multiple) {
      setQuestionSelections((prev) => ({
        ...prev,
        [questionId]: currentSelected.includes(optionId)
          ? currentSelected.filter((id) => id !== optionId)
          : [...currentSelected, optionId],
      }));
    } else {
      setQuestionSelections((prev) => ({
        ...prev,
        [questionId]: [optionId],
      }));
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
    if (!poll) return;

    setIsSubmitting(true);
    setVoteError(null);

    try {
      const user = await getCurrentUser();
      const fingerprint = !user ? generateFingerprint() : undefined;

      // Collect option IDs and structured answers
      const allOptionIds: string[] = [];
      const answers: Record<string, unknown> = {};

      for (const q of questions) {
        const selected = questionSelections[q.id] || [];
        const qAnswer = answerData[q.id] || {};

        switch (q.question_type) {
          case "multiple_choice":
          case "image_choice":
          case "reaction":
            allOptionIds.push(...selected);
            break;
          case "rating_scale":
            answers[q.id] = { rating: qAnswer.rating };
            break;
          case "ranked_choice":
            // Rankings are stored in answers, option IDs in flat array
            allOptionIds.push(...(qAnswer.rankings as string[] || []));
            answers[q.id] = { rankings: qAnswer.rankings };
            break;
          case "open_ended":
            answers[q.id] = { text: qAnswer.text };
            break;
        }
      }

      // Submit vote
      if (user) {
        await submitVote(poll.id, allOptionIds, user.id, undefined, undefined, answers);
      } else {
        await submitVote(poll.id, allOptionIds, undefined, undefined, fingerprint, answers);
      }

      // Submit open-ended responses to poll_responses table
      for (const q of questions) {
        if (q.question_type === "open_ended") {
          const text = (answerData[q.id]?.text as string || "").trim();
          if (text) {
            await supabase.from("poll_responses").insert({
              poll_id: poll.id,
              question_id: q.id,
              user_id: user?.id || null,
              voter_fingerprint: fingerprint || null,
              response_text: text,
            });
          }
        }
      }

      const qResults = await getPollResultsByQuestion(poll.id);
      setQuestionResults(qResults);

      const { count: voterCount } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("poll_id", poll.id);

      setTotalVoters(voterCount || 0);

      setJustVotedFor([...allOptionIds]);
      setHasVotedFlag(true);
      fireConfetti();
      toast.success("Vote submitted!");
    } catch (err) {
      console.error("Error submitting vote:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit vote. Please try again.";
      setVoteError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionHasAnswer = (q: PollQuestion): boolean => {
    const selected = questionSelections[q.id] || [];
    const qAnswer = answerData[q.id] || {};

    switch (q.question_type) {
      case "rating_scale":
        return qAnswer.rating != null;
      case "ranked_choice":
        return ((qAnswer.rankings as string[]) || []).length > 0;
      case "open_ended":
        return ((qAnswer.text as string) || "").trim().length > 0;
      default:
        // multiple_choice, image_choice, reaction
        return selected.length > 0;
    }
  };

  const currentQuestionHasSelection = currentQuestion
    ? questionHasAnswer(currentQuestion)
    : false;

  const allQuestionsAnswered = questions.every((q) => questionHasAnswer(q));

  /** Render the appropriate results for a question based on its type */
  const renderQuestionResults = (qr: QuestionResult, qIndex: number) => {
    const qType = qr.question_type || "multiple_choice";

    // Use specialized results component for non-standard types
    if (qType !== "multiple_choice" && qType !== "image_choice") {
      return (
        <QuestionTypeResults
          questionResult={qr}
          totalVoters={totalVoters}
        />
      );
    }

    // Standard bar results for multiple_choice / image_choice
    return qr.results.map((result, i) =>
      renderResultBar(result, qIndex * 4 + i),
    );
  };

  /** Render the appropriate input UI for a question based on its type */
  const renderQuestionInput = (q: PollQuestion) => {
    const qType = q.question_type || "multiple_choice";

    // For multiple_choice: use the existing option buttons
    if (qType === "multiple_choice") {
      return (
        <>
          <p className="text-center text-sm text-muted-foreground mb-4">
            {q.allow_multiple ? "Select all that apply:" : "Choose one option:"}
          </p>
          <div className="space-y-3">
            {q.options.map((option) => {
              const currentSelected = questionSelections[q.id] || [];
              const isSelected = currentSelected.includes(option.id);
              return renderOptionButton(option, isSelected);
            })}
          </div>
        </>
      );
    }

    // For all other types: use QuestionTypeInput dispatcher
    return (
      <div className="py-2">
        <QuestionTypeInput
          question={q}
          selectedOptions={questionSelections[q.id] || []}
          onToggleOption={(optionId) => handleOptionToggle(optionId)}
          answerData={answerData[q.id] || {}}
          onAnswerChange={(data) =>
            setAnswerData((prev) => ({ ...prev, [q.id]: data }))
          }
        />
      </div>
    );
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

  if (loadError) {
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
            <p className="text-muted-foreground mb-4">{loadError}</p>
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

  // Password gate — show before the poll content
  if (poll.password_hash && !passwordUnlocked && !hasVotedFlag) {
    return (
      <PasswordGate
        passwordHash={poll.password_hash}
        pollTitle={poll.question}
        onUnlock={() => setPasswordUnlocked(true)}
      />
    );
  }

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  const renderResultBar = (result: PollResult, index: number) => {
    const percentage = getPercentage(result.vote_count);
    const isVotedFor = justVotedFor.includes(result.option_id);

    return (
      <motion.div
        key={result.option_id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 }}
        className={`relative p-4 rounded-xl border overflow-hidden ${
          isVotedFor
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-border"
        }`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            delay: index * 0.08,
            ease: "easeOut",
          }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
        />

        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isVotedFor && (
              <IconCheck className="w-4 h-4 text-emerald-500" />
            )}
            <span className="font-medium text-foreground">
              {result.option_text}
            </span>
            {isVotedFor && (
              <span className="text-xs text-emerald-500 font-medium">
                Your vote
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-bold text-foreground">{percentage}%</span>
            <span className="text-xs text-muted-foreground ml-2">
              {result.vote_count}{" "}
              {result.vote_count === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderOptionButton = (
    option: { id: string; text: string },
    isSelected: boolean,
  ) => (
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
        <span className="font-medium text-foreground">{option.text}</span>
      </div>
    </motion.button>
  );

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
                {abVariant ? abVariant.question_text : poll.question}
              </h1>
              {poll.description && (
                <p className="text-muted-foreground">{poll.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                {totalVoters}{" "}
                {totalVoters === 1 ? "person has" : "people have"} voted so far
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

                  {isMultiQuestion
                    ? questionResults.map((qr, qIndex) => (
                        <div key={qr.question_id} className="space-y-3">
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              Q{qr.question_order}
                            </span>
                            <h3 className="font-semibold text-foreground text-sm">
                              {qr.question_text}
                            </h3>
                          </div>
                          {renderQuestionResults(qr, qIndex)}
                        </div>
                      ))
                    : questionResults[0] &&
                      renderQuestionResults(questionResults[0], 0)}
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
                  {voteError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start justify-between gap-2"
                    >
                      <p className="text-sm text-destructive">{voteError}</p>
                      <button
                        onClick={() => setVoteError(null)}
                        className="text-destructive/60 hover:text-destructive text-xs shrink-0"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}

                  {isMultiQuestion && currentQuestion ? (
                    <>
                      {/* Progress bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                          <span>
                            Question {currentQuestionIndex + 1} of{" "}
                            {questions.length}
                          </span>
                          <span>
                            {Math.round(
                              ((currentQuestionIndex + 1) / questions.length) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentQuestion.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                        >
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {currentQuestion.question_text}
                          </h3>

                          {renderQuestionInput(currentQuestion)}
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation buttons */}
                      <div className="flex justify-between items-center pt-4 gap-3">
                        <Button
                          onClick={() =>
                            setCurrentQuestionIndex((prev) =>
                              Math.max(0, prev - 1),
                            )
                          }
                          disabled={currentQuestionIndex === 0}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <IconChevronLeft className="w-4 h-4" />
                          Back
                        </Button>

                        {currentQuestionIndex < questions.length - 1 ? (
                          <Button
                            onClick={() =>
                              setCurrentQuestionIndex((prev) =>
                                Math.min(questions.length - 1, prev + 1),
                              )
                            }
                            disabled={!currentQuestionHasSelection}
                            variant="brand"
                            className="flex items-center gap-1"
                          >
                            Next
                            <IconChevronRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleVote}
                            disabled={!allQuestionsAnswered || isSubmitting}
                            variant="brand"
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
                        )}
                      </div>
                    </>
                  ) : (
                    /* Single-question: existing UI */
                    <>
                      {currentQuestion
                        ? renderQuestionInput(currentQuestion)
                        : (poll.options)?.map(
                            (option) => {
                              const qId = "_legacy";
                              const currentSelected =
                                questionSelections[qId] || [];
                              const isSelected = currentSelected.includes(
                                option.id,
                              );
                              return renderOptionButton(option, isSelected);
                            },
                          ) || (
                            <div className="text-center text-muted-foreground">
                              No options available
                            </div>
                          )}

                      <div className="pt-4">
                        <Button
                          onClick={handleVote}
                          disabled={!allQuestionsAnswered || isSubmitting}
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
                    </>
                  )}
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
