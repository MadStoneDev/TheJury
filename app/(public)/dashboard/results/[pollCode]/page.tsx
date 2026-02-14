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
} from "@tabler/icons-react";
import {
  getPollByCode,
  getPollResults,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ResultsSkeleton from "@/components/skeletons/ResultsSkeleton";
import { exportResultsToCSV } from "@/lib/exportUtils";
import ShareModal from "@/components/ShareModal";
import { Button } from "@/components/ui/button";

export default function PollResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [copiedText, setCopiedText] = useState<string>("");
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
          // Owner - allowed
        } else {
          setError("You don't have permission to view these results");
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
    exportResultsToCSV(poll.question, pollCode, results, totalVoters);
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

  const maxVotes = Math.max(...results.map((r) => r.vote_count));
  const showResultsToVoters = (
    poll as Poll & { show_results_to_voters?: boolean }
  ).show_results_to_voters;

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
        ) : (
          <div className="space-y-4">
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
            })}

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
                    {results.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Options</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">
                    {(() => {
                      if (maxVotes === 0) return "None";
                      const topChoice = results.find(
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
              <IconDownload size={14} />
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
      />
    </div>
  );
}
