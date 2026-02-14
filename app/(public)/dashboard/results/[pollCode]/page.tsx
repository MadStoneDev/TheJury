"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconShare,
  IconUsers,
  IconChartBar,
  IconDownload,
  IconLink,
  IconTrophy,
  IconLock,
} from "@tabler/icons-react";
import {
  getPollByCode,
  getPollResultsByQuestion,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import type { Poll, PollResult, QuestionResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ResultsSkeleton from "@/components/skeletons/ResultsSkeleton";
import { exportResultsToCSV, exportQuestionResultsToCSV } from "@/lib/exportUtils";
import ShareModal from "@/components/ShareModal";
import UpgradeModal from "@/components/UpgradeModal";
import { QuestionTypeResults } from "@/components/question-types";
import { Button } from "@/components/ui/button";
import { canUseFeature } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";

export default function PollResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [copiedText, setCopiedText] = useState<string>("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [userTier, setUserTier] = useState<TierName>("free");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"csvExport" | "qrCodes">("csvExport");

  const isMultiQuestion = questionResults.length > 1;

  // Flat results for single-question summary stats
  const flatResults: PollResult[] = isMultiQuestion
    ? questionResults.flatMap((qr) => qr.results)
    : questionResults[0]?.results || [];

  useEffect(() => {
    const loadPollResults = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        if (user && pollData.user_id === user.id) {
          // Owner - allowed. Fetch tier.
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .single();
          if (profile?.subscription_tier) {
            setUserTier(profile.subscription_tier as TierName);
          }
        } else {
          setError("You don't have permission to view these results");
          return;
        }

        setPoll(pollData);

        const qResults = await getPollResultsByQuestion(pollData.id);
        setQuestionResults(qResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", pollData.id);

        setTotalVoters(voterCount || 0);
      } catch (err) {
        console.error("Error loading poll results:", err);
        setError("Failed to load poll results");
      } finally {
        setIsLoading(false);
      }
    };

    loadPollResults();
  }, [pollCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pollCode);
      setCopiedText("code");
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCopyResultsLink = async () => {
    try {
      const link = `${window.location.origin}/results/${pollCode}`;
      await navigator.clipboard.writeText(link);
      setCopiedText("results");
      toast.success("Results link copied!");
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy results link:", err);
    }
  };

  const handleExportCSV = () => {
    if (!poll) return;
    if (!canUseFeature(userTier, "csvExport")) {
      setUpgradeFeature("csvExport");
      setUpgradeModalOpen(true);
      return;
    }
    if (isMultiQuestion) {
      exportQuestionResultsToCSV(poll.question, pollCode, questionResults, totalVoters);
    } else {
      exportResultsToCSV(poll.question, pollCode, flatResults, totalVoters);
    }
    toast.success("CSV exported!");
  };

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-2xl border bg-card p-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-display text-foreground mb-2">
              Oops!
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/dashboard">
              <Button variant="brand" className="gap-2">
                <IconArrowLeft size={18} />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const showResultsToVoters = (
    poll as Poll & { show_results_to_voters?: boolean }
  ).show_results_to_voters;

  const renderResultBar = (
    result: PollResult,
    index: number,
    maxVotes: number,
  ) => {
    const percentage = getPercentage(result.vote_count);
    const isTopChoice = result.vote_count === maxVotes && maxVotes > 0;

    return (
      <motion.div
        key={result.option_id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 }}
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
            delay: index * 0.08,
            ease: "easeOut",
          }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
        />

        <div className="relative flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
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
            <span className="text-xs text-muted-foreground">
              Option #{result.option_order}
            </span>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-foreground">
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {result.vote_count}{" "}
              {result.vote_count === 1 ? "vote" : "votes"}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <IconArrowLeft size={18} className="mr-1.5" />
        Back to Dashboard
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card overflow-hidden mb-6"
      >
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <IconChartBar size={20} className="text-emerald-500" />
                <h1 className="text-2xl font-display text-foreground">
                  Poll Results
                </h1>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-1">
                {poll.question}
              </h2>

              {poll.description && (
                <p className="text-muted-foreground text-sm mb-3">
                  {poll.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 font-mono bg-muted px-2.5 py-1 rounded-md hover:bg-accent transition-colors"
                >
                  {copiedText === "code" ? (
                    <IconCheck size={14} className="text-emerald-500" />
                  ) : (
                    <IconCopy size={14} />
                  )}
                  {pollCode}
                </button>
                <span className="flex items-center gap-1">
                  <IconUsers size={14} />
                  {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
                </span>
                {isMultiQuestion && (
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {questionResults.length} questions
                  </span>
                )}
                <span>Created {formatDate(poll.created_at)}</span>
                {poll.is_active ? (
                  <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="gap-1.5"
              >
                <IconShare size={16} />
                Share
              </Button>
              <Link href={`/answer/${pollCode}`}>
                <Button variant="brand" size="sm">
                  View Poll
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border bg-card p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Detailed Results
        </h3>

        {totalVoters === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <IconChartBar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No votes yet
            </h4>
            <p className="text-muted-foreground mb-6 text-sm">
              Share your poll to start collecting votes!
            </p>
            <Button
              variant="brand"
              onClick={() => setShareModalOpen(true)}
              className="gap-2"
            >
              <IconShare size={18} />
              Share Poll
            </Button>
          </div>
        ) : isMultiQuestion ? (
          /* Multi-question results: per-question sections */
          <div className="space-y-8">
            {questionResults.map((qr, qIndex) => {
              const qType = qr.question_type || "multiple_choice";
              const qMaxVotes = Math.max(
                ...qr.results.map((r) => r.vote_count),
                0,
              );

              return (
                <div key={qr.question_id}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      Q{qr.question_order}
                    </span>
                    <h4 className="font-semibold text-foreground">
                      {qr.question_text}
                    </h4>
                  </div>

                  {qType !== "multiple_choice" && qType !== "image_choice" ? (
                    <QuestionTypeResults
                      questionResult={qr}
                      totalVoters={totalVoters}
                    />
                  ) : (
                    <div className="space-y-3">
                      {qr.results.map((result, i) =>
                        renderResultBar(result, qIndex * 4 + i, qMaxVotes),
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary Stats */}
            <div className="pt-6 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {totalVoters}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Voters
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {questionResults.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {questionResults.reduce(
                      (sum, qr) => sum + qr.results.length,
                      0,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Options
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single-question results */
          <div className="space-y-4">
            {questionResults[0] &&
            questionResults[0].question_type !== "multiple_choice" &&
            questionResults[0].question_type !== "image_choice" ? (
              <QuestionTypeResults
                questionResult={questionResults[0]}
                totalVoters={totalVoters}
              />
            ) : (
              (() => {
                const maxVotes = Math.max(
                  ...flatResults.map((r) => r.vote_count),
                  0,
                );
                return flatResults.map((result, i) =>
                  renderResultBar(result, i, maxVotes),
                );
              })()
            )}

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {totalVoters}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Voters
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {flatResults.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Options</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">
                    {(() => {
                      const maxVotes = Math.max(
                        ...flatResults.map((r) => r.vote_count),
                        0,
                      );
                      if (maxVotes === 0) return "None";
                      const topChoice = flatResults.find(
                        (r) => r.vote_count === maxVotes,
                      );
                      if (!topChoice?.option_text) return "None";
                      return topChoice.option_text.length > 15
                        ? topChoice.option_text.slice(0, 15) + "..."
                        : topChoice.option_text;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Top Choice
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {poll.allow_multiple ? "Multi" : "Single"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Choice Type
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Management Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-2xl border bg-card p-6"
      >
        <h3 className="font-semibold text-foreground mb-4 text-sm">
          Poll Management
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href={`/edit/${pollCode}`}>
            <Button variant="outline" size="sm">
              Edit Poll
            </Button>
          </Link>
          <Link href={`/answer/${pollCode}`}>
            <Button variant="brand" size="sm">
              View Voting Page
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="gap-1.5"
          >
            <IconShare size={14} />
            Share Poll
          </Button>
          {totalVoters > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5"
            >
              {canUseFeature(userTier, "csvExport") ? (
                <IconDownload size={14} />
              ) : (
                <IconLock size={14} className="text-muted-foreground" />
              )}
              Export CSV
            </Button>
          )}
          {showResultsToVoters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyResultsLink}
              className="gap-1.5"
            >
              <IconLink size={14} />
              {copiedText === "results" ? "Copied!" : "Share Results"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        pollCode={pollCode}
        pollUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/answer/${pollCode}`}
        userTier={userTier}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature={upgradeFeature}
      />
    </div>
  );
}
