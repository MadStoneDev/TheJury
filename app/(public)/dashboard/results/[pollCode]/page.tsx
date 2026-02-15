"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
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
import type { Feature } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";
import { formatDateFull } from "@/lib/dateUtils";
import { BarChart, PieChart, ChartSelector } from "@/components/charts";
import type { ChartType, ChartDataItem } from "@/components/charts";
import type { EmbedTheme } from "@/components/EmbedThemeEditor";
import { DEFAULT_EMBED_THEME } from "@/components/EmbedThemeEditor";
import { updateEmbedSettings } from "@/lib/supabaseHelpers";

// Lazy-load heavy tier-gated components
const AnalyticsDashboard = dynamic(() => import("@/components/analytics/AnalyticsDashboard"), { ssr: false });
const ABTestResults = dynamic(() => import("@/components/ab-testing").then((m) => ({ default: m.ABTestResults })), { ssr: false });
const EmbedThemeEditor = dynamic(() => import("@/components/EmbedThemeEditor"), { ssr: false });

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
  const [upgradeFeature, setUpgradeFeature] = useState<Feature>("csvExport");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [embedTheme, setEmbedTheme] = useState<EmbedTheme>(DEFAULT_EMBED_THEME);
  const [embedThemeLoaded, setEmbedThemeLoaded] = useState(false);

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
        // Fetch user and poll in parallel
        const [user, pollData] = await Promise.all([
          getCurrentUser(),
          getPollByCode(pollCode),
        ]);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        if (user && pollData.user_id === user.id) {
          // Owner - allowed. Fetch tier from profile.
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

        // Load embed theme settings
        const settings = pollData.embed_settings;
        if (settings && typeof settings === "object") {
          setEmbedTheme({ ...DEFAULT_EMBED_THEME, ...(settings as Partial<EmbedTheme>) });
        }
        setEmbedThemeLoaded(true);

        // Fetch results and vote count in parallel
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

  const formatDate = formatDateFull;

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

  const toChartData = (results: PollResult[]): ChartDataItem[] =>
    results.map((r) => ({ label: r.option_text, value: r.vote_count, id: r.option_id }));

  const renderChart = (results: PollResult[]) => {
    const chartData = toChartData(results);
    switch (chartType) {
      case "pie":
        return <PieChart data={chartData} total={totalVoters} />;
      case "donut":
        return <PieChart data={chartData} total={totalVoters} donut />;
      default:
        return <BarChart data={chartData} total={totalVoters} />;
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Detailed Results
          </h3>
          <ChartSelector
            selected={chartType}
            onChange={setChartType}
            userTier={userTier}
            onUpgradeRequest={() => {
              setUpgradeFeature("chartTypes");
              setUpgradeModalOpen(true);
            }}
          />
        </div>

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
            {questionResults.map((qr) => {
              const qType = qr.question_type || "multiple_choice";

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
                    renderChart(qr.results)
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
              renderChart(flatResults)
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

      {/* A/B Test Results (Team tier) */}
      {canUseFeature(userTier, "abTesting") && totalVoters > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-6"
        >
          <ABTestResults pollId={poll.id} />
        </motion.div>
      )}

      {/* Advanced Analytics (Team tier) */}
      {canUseFeature(userTier, "advancedAnalytics") && totalVoters > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-2xl border bg-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Analytics
          </h3>
          <AnalyticsDashboard pollId={poll.id} totalVoters={totalVoters} />
        </motion.div>
      )}

      {/* Embed Theme Editor (Pro/Team) */}
      {canUseFeature(userTier, "customEmbedThemes") && embedThemeLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl border bg-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Embed Theme
          </h3>
          <EmbedThemeEditor
            theme={embedTheme}
            onChange={async (newTheme) => {
              setEmbedTheme(newTheme);
              if (poll) {
                await updateEmbedSettings(poll.id, { ...newTheme });
                toast.success("Embed theme saved!");
              }
            }}
          />
        </motion.div>
      )}

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
