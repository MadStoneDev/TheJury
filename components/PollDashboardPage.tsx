"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  IconPlus,
  IconEdit,
  IconEye,
  IconTrash,
  IconCheck,
  IconX,
  IconChartBar,
  IconCode,
  IconShare,
  IconCopy as IconCopyFiles,
  IconClock,
} from "@tabler/icons-react";
import {
  getUserPolls,
  deletePoll,
  togglePollStatus,
  getCurrentUser,
  duplicatePoll,
  getProfile,
} from "@/lib/supabaseHelpers";
import { toast } from "sonner";
import type { Poll } from "@/lib/supabaseHelpers";
import EmbedCodeGenerator from "@/components/EmbedCodeGenerator";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import DashboardControls from "@/components/DashboardControls";
import type { StatusFilter, SortOption } from "@/components/DashboardControls";
import Pagination from "@/components/Pagination";
import ShareModal from "@/components/ShareModal";
import UpgradeModal from "@/components/UpgradeModal";
import { getFeatureLimit } from "@/lib/featureGate";
import type { TierName } from "@/lib/stripe";
import { formatDateShort } from "@/lib/dateUtils";

const POLLS_PER_PAGE = 10;

export default function PollDashboardPage() {
  // States
  const router = useRouter();
  const searchParams = useSearchParams();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmbedCode, setShowEmbedCode] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Controls state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Share modal state
  const [shareModalPollCode, setShareModalPollCode] = useState<string | null>(
    null,
  );

  // Tier & active poll limit state
  const [userTier, setUserTier] = useState<TierName>("free");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const cachedUserIdRef = useRef<string | null>(null);

  // Derive active poll count from already-fetched polls
  const activePollCount = useMemo(() => polls.filter((p) => p.is_active).length, [polls]);

  // Show checkout success toast
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to your new plan! Your subscription is active.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const loadPolls = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        cachedUserIdRef.current = user.id;

        // Fetch polls and profile in parallel
        const [userPolls, profile] = await Promise.all([
          getUserPolls(user.id),
          getProfile(user.id),
        ]);
        setPolls(userPolls);
        setUserTier((profile?.subscription_tier as TierName) || "free");
      } catch (err) {
        console.error("Error loading polls:", err);
        setError("Failed to load polls");
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, [router]);

  // Filtered + sorted polls
  const filteredPolls = useMemo(() => {
    let result = [...polls];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.question.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((p) => !p.is_active);
    }

    // Sort
    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "most-votes":
        result.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
        break;
      case "least-votes":
        result.sort((a, b) => (a.total_votes || 0) - (b.total_votes || 0));
        break;
    }

    return result;
  }, [polls, search, statusFilter, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredPolls.length / POLLS_PER_PAGE);
  const paginatedPolls = filteredPolls.slice(
    (currentPage - 1) * POLLS_PER_PAGE,
    currentPage * POLLS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOption]);

  const handleTogglePollStatus = async (pollId: string) => {
    try {
      const result = await togglePollStatus(pollId);
      if (result.success) {
        const poll = polls.find((p) => p.id === pollId);
        const wasActive = poll?.is_active;
        setPolls((prev) =>
          prev.map((p) =>
            p.id === pollId ? { ...p, is_active: !p.is_active } : p,
          ),
        );
        toast.success(wasActive ? "Poll deactivated" : "Poll activated");
      } else if (result.error) {
        // Hit the active poll limit — show upgrade modal
        if (result.error.includes("limit")) {
          setUpgradeModalOpen(true);
        }
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error toggling poll status:", err);
      toast.error("Failed to update poll status");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const success = await deletePoll(pollId);
      if (success) {
        setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
        setDeleteConfirm("");
        toast.success("Poll deleted");
      } else {
        setError("Failed to delete poll");
        toast.error("Failed to delete poll");
      }
    } catch (err) {
      console.error("Error deleting poll:", err);
      setError("Failed to delete poll");
      toast.error("Failed to delete poll");
    }
  };

  const handleDuplicatePoll = async (pollId: string) => {
    try {
      if (!cachedUserIdRef.current) {
        toast.error("Not authenticated");
        return;
      }
      const newCode = await duplicatePoll(pollId, cachedUserIdRef.current);
      if (newCode) {
        toast.success("Poll duplicated!");
        router.push(`/edit/${newCode}`);
      } else {
        toast.error("Failed to duplicate poll");
      }
    } catch (err) {
      console.error("Error duplicating poll:", err);
      toast.error("Failed to duplicate poll");
    }
  };

  const formatDate = formatDateShort;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isFiltered = search.trim() || statusFilter !== "all";

  return (
    <div className="min-h-screen sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-between xs:items-center gap-4 mb-8 transition-all duration-200 ease-in-out"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Your Polls
            </h1>
            <p className="text-muted-foreground">
              Manage and track all your polls in one place
            </p>
          </div>
          <Button variant="brand" size="lg" asChild>
            <Link href={`/create`}>
              <IconPlus size={20} />
              <span>Create New Poll</span>
            </Link>
          </Button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
          >
            <div className="text-destructive text-sm">{error}</div>
            <button
              onClick={() => setError("")}
              className="mt-2 text-sm text-destructive underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 mb-6">
          <HoverCard>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                <div className="text-sm text-muted-foreground">Total Polls</div>
              </div>
              <div className="text-2xl font-bold text-foreground pl-5">
                {polls.length}
              </div>
            </div>
          </HoverCard>
          <HoverCard>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="text-sm text-muted-foreground">Active Polls</div>
              </div>
              <div className="text-2xl font-bold text-emerald-500 pl-5">
                {polls.filter((p) => p.is_active).length}
              </div>
            </div>
          </HoverCard>
          <HoverCard>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div className="text-2xl font-bold text-foreground pl-5">
                {polls.reduce((sum, p) => sum + (p.total_votes || 0), 0)}
              </div>
            </div>
          </HoverCard>
          <HoverCard>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                <div className="text-sm text-muted-foreground">Avg Votes/Poll</div>
              </div>
              <div className="text-2xl font-bold text-foreground pl-5">
                {polls.length > 0
                  ? Math.round(
                      polls.reduce((sum, p) => sum + (p.total_votes || 0), 0) /
                        polls.length,
                    )
                  : 0}
              </div>
            </div>
          </HoverCard>
        </div>

        {/* Active Poll Limit Indicator (free tier only) */}
        {userTier === "free" && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Active Polls
              </span>
              <span className="text-sm text-muted-foreground">
                {activePollCount} / {getFeatureLimit("free", "maxActivePolls")}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activePollCount >= getFeatureLimit("free", "maxActivePolls")
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(
                    (activePollCount / getFeatureLimit("free", "maxActivePolls")) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
            {activePollCount >= getFeatureLimit("free", "maxActivePolls") && (
              <p className="text-xs text-amber-500 mt-2">
                You&apos;ve reached your free tier limit.{" "}
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="underline hover:text-amber-400 transition-colors"
                >
                  Upgrade for unlimited
                </button>
              </p>
            )}
          </motion.div>
        )}

        {/* Controls */}
        {polls.length > 0 && (
          <DashboardControls
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        )}

        {/* Filtered count */}
        {polls.length > 0 && isFiltered && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredPolls.length} of {polls.length} polls
          </p>
        )}

        {/* Polls List */}
        {polls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl border border-border p-12 text-center"
          >
            <div className="text-6xl mb-4">
              <IconChartBar size={64} className="mx-auto text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              No polls yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first poll to get started!
            </p>
            <Button variant="brand" size="lg" asChild>
              <Link href={`/create`}>
                <IconPlus size={20} />
                <span>Create Your First Poll</span>
              </Link>
            </Button>
          </motion.div>
        ) : filteredPolls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl border border-border p-12 text-center"
          >
            <div className="text-6xl mb-4">
              <IconEye size={64} className="mx-auto text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              No polls match
            </h2>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <>
            <StaggerContainer className="space-y-4">
              {paginatedPolls.map((poll) => (
                <StaggerItem key={poll.id}>
                  <div
                    className={`relative bg-card rounded-2xl border border-border p-4 sm:p-6 transition-colors border-l-4 ${
                      poll.is_active
                        ? "border-l-emerald-500"
                        : "border-l-muted-foreground/30"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between lg:justify-start gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground max-w-[300px]">
                            {poll.question}
                          </h3>

                          <div className="flex items-center space-x-2">
                            {poll.allow_multiple && (
                              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                                Multiple Choice
                              </span>
                            )}
                            {poll.is_active ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                Active
                              </span>
                            ) : (
                              <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                                Inactive
                              </span>
                            )}
                            {poll.has_time_limit && (() => {
                              const now = new Date();
                              const start = poll.start_date ? new Date(poll.start_date) : null;
                              const end = poll.end_date ? new Date(poll.end_date) : null;

                              if (start && start > now) {
                                const diff = start.getTime() - now.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                return (
                                  <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                                    <IconClock size={12} />
                                    Starts in {days > 0 ? `${days}d` : `${hours}h`}
                                  </span>
                                );
                              }
                              if (end && end > now) {
                                const diff = end.getTime() - now.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                return (
                                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                                    <IconClock size={12} />
                                    Ends in {days > 0 ? `${days}d` : `${hours}h`}
                                  </span>
                                );
                              }
                              if (end && end < now) {
                                return (
                                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                                    <IconClock size={12} />
                                    Ended
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        {poll.description && (
                          <p className="text-muted-foreground mb-2">
                            {poll.description}
                          </p>
                        )}

                        <div className="py-4 md:py-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-t border-b md:border-0 border-border text-xs font-light text-muted-foreground">
                          <span>
                            Code:{" "}
                            <span className="font-mono font-semibold bg-muted px-2 py-0.5 rounded text-xs">
                              {poll.code}
                            </span>
                          </span>
                          <span>{poll.total_votes || 0} votes</span>
                          {(poll.question_count || 1) > 1 && (
                            <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                              {poll.question_count} questions
                            </span>
                          )}
                          <span>Created {formatDate(poll.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 lg:max-w-[400px]">
                        {/* Share */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setShareModalPollCode(poll.code)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <IconShare size={18} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Share poll</TooltipContent>
                        </Tooltip>

                        {/* View Poll */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/answer/${poll.code}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <IconEye size={18} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>View poll</TooltipContent>
                        </Tooltip>

                        {/* View Results */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/dashboard/results/${poll.code}`}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <IconChartBar size={18} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>See analytics</TooltipContent>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/edit/${poll.code}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <IconEdit size={18} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Edit poll</TooltipContent>
                        </Tooltip>

                        {/* Embed Code */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                setShowEmbedCode(
                                  showEmbedCode === poll.id ? "" : poll.id,
                                )
                              }
                              className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                            >
                              <IconCode size={18} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Embed code</TooltipContent>
                        </Tooltip>

                        {/* Duplicate */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDuplicatePoll(poll.id)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <IconCopyFiles size={18} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate poll</TooltipContent>
                        </Tooltip>

                        {/* Toggle Active/Inactive */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleTogglePollStatus(poll.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                poll.is_active
                                  ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              {poll.is_active ? (
                                <IconCheck size={18} />
                              ) : (
                                <IconX size={18} />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {poll.is_active ? "Deactivate poll" : "Activate poll"}
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete */}
                        {deleteConfirm === poll.id ? (
                          <div className="absolute inset-0 flex flex-col justify-center items-center space-y-2 bg-card/95 backdrop-blur-sm rounded-2xl z-10">
                            <span className="text-foreground text-sm">
                              Are you sure you want to delete this poll?
                            </span>
                            <div className="flex justify-center items-center space-x-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePoll(poll.id)}
                              >
                                Yes, chop it
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm("")}
                              >
                                Wait, no. Scratch that
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setDeleteConfirm(poll.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <IconTrash size={18} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete poll</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Embed Code Generator - Shows when toggled */}
                    {showEmbedCode === poll.id && (
                      <div className="border-t border-border p-6 bg-muted/50 rounded-b-2xl -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-4">
                        <EmbedCodeGenerator pollCode={poll.code} />
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* Quick Actions Footer */}
        <div className="mt-12 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="brand" asChild>
              <Link href={`/create`}>
                <IconPlus size={18} />
                Create New Poll
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={!!shareModalPollCode}
        onOpenChange={(open) => {
          if (!open) setShareModalPollCode(null);
        }}
        pollCode={shareModalPollCode || ""}
        pollUrl={
          shareModalPollCode
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/answer/${shareModalPollCode}`
            : ""
        }
        userTier={userTier}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="maxActivePolls"
      />
    </div>
  );
}
