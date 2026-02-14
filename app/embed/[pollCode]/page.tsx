// /embed/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { IconCheck, IconLoader2, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {
  getPollByCode,
  submitVote,
  hasUserVoted,
  getUserVotes,
  getPollResultsByQuestion,
  getCurrentUser,
  generateFingerprint,
} from "@/lib/supabaseHelpers";
import type { Poll, PollQuestion, PollResult, QuestionResult } from "@/lib/supabaseHelpers";
import { supabase } from "@/lib/supabase";
import { QuestionTypeInput, QuestionTypeResults } from "@/components/question-types";

export default function PollEmbedPage() {
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
  const [targetOrigin, setTargetOrigin] = useState("*");
  const [ownerTier, setOwnerTier] = useState<string>("free");

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

  // Determine target origin for postMessage
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const originParam = searchParams.get("origin");
    if (originParam) {
      try {
        const url = new URL(originParam);
        setTargetOrigin(url.origin);
        return;
      } catch {
        // invalid URL, fall through
      }
    }
    if (document.referrer) {
      try {
        const url = new URL(document.referrer);
        setTargetOrigin(url.origin);
        return;
      } catch {
        // invalid referrer, fall through
      }
    }
  }, []);

  // Auto-resize iframe function
  useEffect(() => {
    const resizeIframe = () => {
      const height = document.documentElement.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: "resize", height: height },
          targetOrigin,
        );
      }
    };

    resizeIframe();
    const observer = new ResizeObserver(resizeIframe);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [targetOrigin]);

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
            setLoadError("Voting has not started yet");
            return;
          }
          if (pollData.end_date && new Date(pollData.end_date) < now) {
            setLoadError("Voting has ended");
            return;
          }
        }

        setPoll(pollData);

        // Fetch poll owner's subscription tier for branding
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", pollData.user_id)
          .single();
        if (ownerProfile?.subscription_tier) {
          setOwnerTier(ownerProfile.subscription_tier);
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

  const handleVote = async () => {
    if (!poll) return;

    setIsSubmitting(true);
    setVoteError(null);

    try {
      const user = await getCurrentUser();
      const fingerprint = !user ? generateFingerprint() : undefined;

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
            allOptionIds.push(...(qAnswer.rankings as string[] || []));
            answers[q.id] = { rankings: qAnswer.rankings };
            break;
          case "open_ended":
            answers[q.id] = { text: qAnswer.text };
            break;
        }
      }

      if (user) {
        await submitVote(poll.id, allOptionIds, user.id, undefined, undefined, answers);
      } else {
        await submitVote(poll.id, allOptionIds, undefined, undefined, fingerprint, answers);
      }

      // Submit open-ended responses
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
    } catch (err) {
      console.error("Error submitting vote:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit vote. Please try again.";
      setVoteError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
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
        return selected.length > 0;
    }
  };

  const currentQuestionHasSelection = currentQuestion
    ? questionHasAnswer(currentQuestion)
    : false;

  const allQuestionsAnswered = questions.every((q) => questionHasAnswer(q));

  const renderEmbedQuestionResults = (qr: QuestionResult) => {
    const qType = qr.question_type || "multiple_choice";

    if (qType !== "multiple_choice" && qType !== "image_choice") {
      return (
        <QuestionTypeResults
          questionResult={qr}
          totalVoters={totalVoters}
        />
      );
    }

    return qr.results.map((result) => renderCompactResultBar(result));
  };

  const renderEmbedQuestionInput = (q: PollQuestion) => {
    const qType = q.question_type || "multiple_choice";

    if (qType === "multiple_choice") {
      return (
        <>
          <p className="text-xs text-muted-foreground text-center mb-3">
            {q.allow_multiple ? "Select all that apply:" : "Choose one option:"}
          </p>
          <div className="space-y-2">
            {q.options.map((option) => {
              const currentSelected = questionSelections[q.id] || [];
              const isSelected = currentSelected.includes(option.id);
              return renderCompactOptionButton(option, isSelected);
            })}
          </div>
        </>
      );
    }

    return (
      <div className="py-1">
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
      <div className="p-4 bg-background min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-background min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-destructive text-lg">!</span>
          </div>
          <p className="text-muted-foreground text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const renderCompactResultBar = (result: PollResult) => {
    const percentage = getPercentage(result.vote_count);
    const isVotedFor = justVotedFor.includes(result.option_id);
    return (
      <div key={result.option_id}>
        <div
          className={`relative flex justify-between items-center p-3 rounded-lg overflow-hidden ${
            isVotedFor
              ? "bg-emerald-500/5 border border-emerald-500/30"
              : "bg-muted/50 border border-border"
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
          <div className="relative flex items-center gap-1.5">
            {isVotedFor && (
              <IconCheck size={14} className="text-emerald-500" />
            )}
            <span className="text-sm font-medium text-foreground">
              {result.option_text}
            </span>
          </div>
          <div className="relative font-bold text-sm text-foreground">
            {percentage}%
          </div>
        </div>
      </div>
    );
  };

  const renderCompactOptionButton = (
    option: { id: string; text: string },
    isSelected: boolean,
  ) => (
    <button
      key={option.id}
      type="button"
      onClick={() => handleOptionToggle(option.id)}
      className={`w-full flex items-center p-3 border-2 rounded-lg text-left transition-all ${
        isSelected
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mr-2.5 ${
          isSelected
            ? "border-emerald-500 bg-emerald-500"
            : "border-muted-foreground/30"
        }`}
      >
        {isSelected && (
          <IconCheck className="w-2.5 h-2.5 text-white" />
        )}
      </div>
      <span className="text-sm font-medium text-foreground">
        {option.text}
      </span>
    </button>
  );

  return (
    <div className="bg-background p-4 font-sans">
      {/* Compact poll header */}
      <div className="mb-4">
        <h2 className="text-lg font-display text-foreground mb-1">
          {poll.question}
        </h2>
        {poll.description && (
          <p className="text-muted-foreground text-sm mb-2">
            {poll.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          {totalVoters} {totalVoters === 1 ? "vote" : "votes"}
        </div>
      </div>

      {hasVotedFlag ? (
        /* Compact Results View */
        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IconCheck size={14} className="text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Thanks for voting!
            </p>
          </div>

          {isMultiQuestion
            ? questionResults.map((qr) => (
                <div key={qr.question_id} className="space-y-2">
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Q{qr.question_order}
                    </span>
                    <h4 className="font-semibold text-foreground text-xs">
                      {qr.question_text}
                    </h4>
                  </div>
                  {renderEmbedQuestionResults(qr)}
                </div>
              ))
            : questionResults[0] &&
              renderEmbedQuestionResults(questionResults[0])}
        </div>
      ) : (
        /* Compact Voting View */
        <div className="space-y-2">
          {voteError && (
            <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start justify-between gap-2">
              <p className="text-xs text-destructive">{voteError}</p>
              <button
                onClick={() => setVoteError(null)}
                className="text-destructive/60 hover:text-destructive text-xs shrink-0"
              >
                &times;
              </button>
            </div>
          )}

          {isMultiQuestion && currentQuestion ? (
            <>
              {/* Compact progress */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
                  <span>
                    Q{currentQuestionIndex + 1}/{questions.length}
                  </span>
                  <span>
                    {Math.round(
                      ((currentQuestionIndex + 1) / questions.length) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1">
                {currentQuestion.question_text}
              </h3>

              {renderEmbedQuestionInput(currentQuestion)}

              {/* Compact navigation */}
              <div className="flex justify-between items-center pt-2 gap-2">
                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronLeft size={14} />
                  Back
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(questions.length - 1, prev + 1),
                      )
                    }
                    disabled={!currentQuestionHasSelection}
                    className="flex items-center gap-0.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Next
                    <IconChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleVote}
                    disabled={!allQuestionsAnswered || isSubmitting}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white px-6 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-glow-emerald"
                  >
                    {isSubmitting ? "Voting..." : "Vote"}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Single-question: existing compact UI */
            <>
              {currentQuestion
                ? renderEmbedQuestionInput(currentQuestion)
                : (poll.options)?.map((option) => {
                    const qId = "_legacy";
                    const currentSelected = questionSelections[qId] || [];
                    const isSelected = currentSelected.includes(option.id);
                    return renderCompactOptionButton(option, isSelected);
                  }) || (
                    <div className="text-muted-foreground">
                      No options available
                    </div>
                  )}

              <div className="pt-2 text-center">
                <button
                  onClick={handleVote}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow-emerald"
                >
                  {isSubmitting ? "Voting..." : "Vote"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compact footer — only shown for free tier */}
      {ownerTier === "free" && (
        <div className="text-center mt-4 pt-3 border-t border-border">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || "https://thejury.app"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
          >
            Powered by TheJury
          </a>
        </div>
      )}
    </div>
  );
}
