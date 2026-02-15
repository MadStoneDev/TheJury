"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { IconLoader2 } from "@tabler/icons-react";
import {
  getPollByCode,
  getPollResultsByQuestion,
  getCurrentUser,
  getProfile,
  updatePollLiveState,
} from "@/lib/supabaseHelpers";
import type { Poll, QuestionResult } from "@/lib/supabaseHelpers";
import { supabase } from "@/lib/supabase";
import { canUseFeature } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import {
  PresenterBarChart,
  PresenterControls,
  LiveVoteCounter,
  PresenterQRCode,
} from "@/components/presenter";
import type { ChartDataItem } from "@/components/charts";
import { QuestionTypeResults } from "@/components/question-types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PresenterPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [liveState, setLiveState] = useState("accepting_votes");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const reconcileRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Realtime: auto-refresh results on new votes
  const refreshResults = useCallback(async () => {
    if (!poll) return;
    const [qResults, { count: voterCount }] = await Promise.all([
      getPollResultsByQuestion(poll.id),
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("poll_id", poll.id),
    ]);
    setQuestionResults(qResults);
    setTotalVoters(voterCount || 0);
  }, [poll]);

  const { isConnected } = useRealtimeVotes({
    pollId: poll?.id ?? null,
    onNewVote: refreshResults,
  });

  // Periodic full reconciliation (every 30s)
  useEffect(() => {
    if (!poll) return;
    reconcileRef.current = setInterval(refreshResults, 30000);
    return () => {
      if (reconcileRef.current) clearInterval(reconcileRef.current);
    };
  }, [poll, refreshResults]);

  // Load poll data
  useEffect(() => {
    const load = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const [user, pollData] = await Promise.all([
          getCurrentUser(),
          getPollByCode(pollCode),
        ]);

        if (!user) {
          setError("You must be logged in to use Presenter Mode.");
          return;
        }

        if (!pollData) {
          setError("Poll not found.");
          return;
        }

        if (pollData.user_id !== user.id) {
          setError("You can only present your own polls.");
          return;
        }

        // Check tier access
        const profile = await getProfile(user.id);
        const tier = (profile?.subscription_tier as TierName) || "free";
        if (!canUseFeature(tier, "presenterMode")) {
          setAccessDenied(true);
          return;
        }

        setPoll(pollData);

        // Enable live mode on the poll
        await updatePollLiveState(pollData.id, {
          live_mode: true,
          live_state: "accepting_votes",
          live_current_question: 1,
        });

        setLiveState("accepting_votes");
        setCurrentQuestion(pollData.live_current_question || 1);

        // Fetch results
        const [qResults, { count: voterCount }] = await Promise.all([
          getPollResultsByQuestion(pollData.id),
          supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", pollData.id),
        ]);
        setQuestionResults(qResults);
        setTotalVoters(voterCount || 0);
      } catch (err) {
        console.error("Error loading presenter:", err);
        setError("Failed to load poll.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [pollCode]);

  // Disable live mode on unmount
  useEffect(() => {
    return () => {
      if (poll) {
        updatePollLiveState(poll.id, { live_mode: false });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll?.id]);

  const handleToggleResults = async () => {
    if (!poll) return;
    const resultsVisible =
      liveState === "accepting_votes" || liveState === "results_revealed";
    const newState = resultsVisible ? "results_hidden" : "results_revealed";
    setLiveState(newState);
    await updatePollLiveState(poll.id, { live_state: newState });
  };

  const handlePrevQuestion = async () => {
    if (!poll || currentQuestion <= 1) return;
    const next = currentQuestion - 1;
    setCurrentQuestion(next);
    await updatePollLiveState(poll.id, { live_current_question: next });
  };

  const handleNextQuestion = async () => {
    if (!poll) return;
    const totalQ = questionResults.length || 1;
    if (currentQuestion >= totalQ) return;
    const next = currentQuestion + 1;
    setCurrentQuestion(next);
    await updatePollLiveState(poll.id, { live_current_question: next });
  };

  const handleClosePoll = async () => {
    if (!poll) return;
    setLiveState("closed");
    await updatePollLiveState(poll.id, {
      live_state: "closed",
      is_active: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-white/60">Loading presenter mode...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#x1F512;</span>
          </div>
          <h1 className="text-2xl font-display text-white mb-2">
            Upgrade Required
          </h1>
          <p className="text-white/60 mb-6">
            Presenter Mode is available on Pro and Team plans. Present polls live
            with real-time vote animations and QR audience join.
          </p>
          <Link href="/pricing">
            <Button variant="brand" size="lg">
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-400">!</span>
          </div>
          <h1 className="text-xl font-display text-white mb-2">Error</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button variant="brand">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalQuestions = questionResults.length || 1;
  const currentQR = questionResults[currentQuestion - 1];
  const answerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/answer/${pollCode}`
      : `/answer/${pollCode}`;

  const resultsVisible =
    liveState === "accepting_votes" || liveState === "results_revealed";

  const toChartData = (
    results: { option_id: string; option_text: string; vote_count: number }[],
  ): ChartDataItem[] =>
    results.map((r) => ({
      label: r.option_text,
      value: r.vote_count,
      id: r.option_id,
    }));

  const renderCurrentResults = () => {
    if (!currentQR) return null;
    const qType = currentQR.question_type || "multiple_choice";

    if (qType !== "multiple_choice" && qType !== "image_choice") {
      return (
        <div className="[&_*]:text-white [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60">
          <QuestionTypeResults
            questionResult={currentQR}
            totalVoters={totalVoters}
          />
        </div>
      );
    }

    return (
      <PresenterBarChart
        data={toChartData(currentQR.results)}
        total={totalVoters}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </span>
            {liveState === "closed" && (
              <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-sm font-medium">
                Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-8 pb-32 flex flex-col">
        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {totalQuestions > 1 && (
            <span className="text-sm text-white/40 font-mono mb-2 block">
              Question {currentQuestion} of {totalQuestions}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white leading-tight">
            {currentQR?.question_text || poll.question}
          </h1>
        </motion.div>

        {/* Results or hidden state */}
        <div className="flex-1 flex flex-col justify-center">
          {resultsVisible ? (
            <motion.div
              key={`results-${currentQuestion}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentResults()}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">&#128064;</span>
              </div>
              <p className="text-2xl text-white/40 font-medium">
                Results hidden
              </p>
              <p className="text-white/20 mt-2">
                Click &ldquo;Show Results&rdquo; in the controls below
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer: QR + vote count */}
        <div className="flex items-end justify-between mt-auto pt-8">
          <PresenterQRCode pollCode={pollCode} answerUrl={answerUrl} />
          <LiveVoteCounter count={totalVoters} />
        </div>
      </div>

      {/* Controls */}
      <PresenterControls
        liveState={liveState}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        isConnected={isConnected}
        onToggleResults={handleToggleResults}
        onPrevQuestion={handlePrevQuestion}
        onNextQuestion={handleNextQuestion}
        onClosePoll={handleClosePoll}
      />
    </div>
  );
}
