"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Share2,
  BarChart3,
  Pencil,
  MoreHorizontal,
  Eye,
  Code,
  Copy,
  Power,
  Trash2,
  Presentation,
  FileText,
  Sparkles,
  Users,
} from "lucide-react";
import { togglePollStatusAction } from "@/app/actions/polls";
import {
  getUserPolls,
  deletePoll,
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
import { IconTile } from "@/components/design/IconTile";
import { canUseFeature } from "@/lib/featureGate";
import { pluralize } from "@/lib/utils";
import type { TierName } from "@/lib/stripe";
import { formatDateShort } from "@/lib/dateUtils";

const POLLS_PER_PAGE = 10;

export default function PollDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmbedCode, setShowEmbedCode] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [shareModalPollCode, setShareModalPollCode] = useState<string | null>(
    null,
  );
  const [userTier, setUserTier] = useState<TierName>("free");
  const cachedUserIdRef = useRef<string | null>(null);

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

  // Close the overflow menu on outside click or Esc.
  useEffect(() => {
    if (!openMenuId) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-poll-menu]") && !t.closest("[data-poll-menu-btn]")) {
        setOpenMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  const filteredPolls = useMemo(() => {
    let result = [...polls];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.question.toLowerCase().includes(q));
    }
    if (statusFilter === "active") result = result.filter((p) => p.is_active);
    else if (statusFilter === "inactive")
      result = result.filter((p) => !p.is_active);

    switch (sortOption) {
      case "newest":
        result.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        break;
      case "oldest":
        result.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
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

  const totalPages = Math.ceil(filteredPolls.length / POLLS_PER_PAGE);
  const paginatedPolls = filteredPolls.slice(
    (currentPage - 1) * POLLS_PER_PAGE,
    currentPage * POLLS_PER_PAGE,
  );

  useEffect(() => setCurrentPage(1), [search, statusFilter, sortOption]);

  const handleTogglePollStatus = async (pollId: string) => {
    setOpenMenuId(null);
    try {
      const result = await togglePollStatusAction(pollId);
      if (result.ok) {
        const wasActive = polls.find((p) => p.id === pollId)?.is_active;
        setPolls((prev) =>
          prev.map((p) =>
            p.id === pollId ? { ...p, is_active: result.data!.isActive } : p,
          ),
        );
        toast.success(wasActive ? "Voting closed" : "Voting reopened");
      } else {
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
        setPolls((prev) => prev.filter((p) => p.id !== pollId));
        setDeleteConfirm("");
        toast.success("Poll deleted");
      } else {
        toast.error("Failed to delete poll");
      }
    } catch (err) {
      console.error("Error deleting poll:", err);
      toast.error("Failed to delete poll");
    }
  };

  const handleDuplicatePoll = async (pollId: string) => {
    setOpenMenuId(null);
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

  if (isLoading) return <DashboardSkeleton />;

  const totalVotes = polls.reduce((s, p) => s + (p.total_votes || 0), 0);
  const activeCount = polls.filter((p) => p.is_active).length;
  const avgVotes = polls.length ? Math.round(totalVotes / polls.length) : 0;
  const latest = polls
    .map((p) => p.created_at)
    .sort()
    .at(-1);

  const actionBtn =
    "inline-flex items-center gap-1.5 rounded-[9px] border border-jury-border-strong px-3 py-1.5 text-[13px] font-medium text-jury-body transition hover:border-white/25";

  return (
    <div className="min-h-screen bg-jury-base">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-[28px] text-jury-text sm:text-[32px]">
              Your polls
            </h1>
            <p className="mt-1 text-[15px] text-jury-muted">
              Manage and track every poll in one place.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-jury-emerald px-5 text-[14px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
          >
            <Plus size={17} strokeWidth={2.2} />
            Create new poll
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-jury-danger/30 bg-jury-danger/10 p-4 text-[14px] text-jury-danger">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {polls.length > 0 && (
          <>
            {/* Slim stats strip */}
            <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-jury-border bg-jury-surface px-6 py-4">
              <Stat value={polls.length} label={pluralize(polls.length, "poll").split(" ")[1]} />
              <Divider />
              <Stat value={activeCount} label="active" emerald />
              <Divider />
              <Stat value={totalVotes} label="votes" />
              <Divider />
              <Stat value={avgVotes} label="avg per poll" />
              {latest && (
                <span className="ml-auto text-[13px] text-jury-dim">
                  Latest {formatDateShort(latest)}
                </span>
              )}
            </div>

            {/* Filters */}
            <DashboardControls
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />
          </>
        )}

        {/* Empty / list */}
        {polls.length === 0 ? (
          <EmptyState />
        ) : filteredPolls.length === 0 ? (
          <div className="rounded-xl border border-jury-border bg-jury-surface p-12 text-center">
            <h2 className="font-display text-2xl text-jury-text">No polls match</h2>
            <p className="mt-2 text-jury-muted">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-6 rounded-full border border-jury-border-strong px-5 py-2 text-[14px] text-jury-body transition hover:border-white/25"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPolls.map((poll) => {
                const menuOpen = openMenuId === poll.id;
                return (
                  <div
                    key={poll.id}
                    className="relative rounded-xl border border-jury-border bg-jury-surface px-6 py-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[18px] font-semibold text-jury-text">
                            {poll.question}
                          </h3>
                          {poll.is_active ? (
                            <span className="rounded-full border border-jury-emerald-line bg-jury-emerald-tint px-2 py-0.5 text-[11px] font-semibold text-jury-emerald">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full border border-jury-border bg-jury-input px-2 py-0.5 text-[11px] font-semibold text-jury-dim">
                              Closed
                            </span>
                          )}
                          <span className="rounded-md bg-jury-input px-2 py-0.5 text-[11px] text-jury-dim">
                            {(poll.question_count || 1) > 1
                              ? pluralize(poll.question_count || 0, "question")
                              : poll.allow_multiple
                                ? "Multiple choice"
                                : "Single choice"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-jury-dim">
                          <span>
                            Code{" "}
                            <span className="rounded bg-jury-input px-1.5 py-0.5 font-mono text-jury-muted">
                              {poll.code}
                            </span>
                          </span>
                          <span>{pluralize(poll.total_votes || 0, "vote")}</span>
                          <span>Created {formatDateShort(poll.created_at)}</span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShareModalPollCode(poll.code)}
                          className={actionBtn}
                        >
                          <Share2 size={15} /> Share
                        </button>
                        <Link href={`/dashboard/results/${poll.code}`} className={actionBtn}>
                          <BarChart3 size={15} /> Results
                        </Link>
                        <Link href={`/edit/${poll.code}`} className={actionBtn}>
                          <Pencil size={15} /> Edit
                        </Link>
                        <button
                          data-poll-menu-btn
                          onClick={() => setOpenMenuId(menuOpen ? null : poll.id)}
                          aria-label="More actions"
                          className="flex h-9 w-[38px] items-center justify-center rounded-[9px] border border-jury-border-strong text-jury-muted transition hover:border-white/25 hover:text-jury-text"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {menuOpen && (
                          <div
                            data-poll-menu
                            className="absolute right-6 top-16 z-20 w-[220px] rounded-xl border border-jury-border bg-jury-menu p-1.5 shadow-[0_30px_70px_-20px_rgba(0,0,0,.9)]"
                          >
                            <MenuItem
                              icon={Eye}
                              label="View voting page"
                              href={`/answer/${poll.code}`}
                            />
                            <MenuItem
                              icon={Code}
                              label="Embed code"
                              onClick={() => {
                                setShowEmbedCode(showEmbedCode === poll.id ? "" : poll.id);
                                setOpenMenuId(null);
                              }}
                            />
                            <MenuItem
                              icon={Copy}
                              label="Duplicate"
                              onClick={() => handleDuplicatePoll(poll.id)}
                            />
                            {canUseFeature(userTier, "presenterMode") && (
                              <MenuItem
                                icon={Presentation}
                                label="Present live"
                                href={`/present/${poll.code}`}
                              />
                            )}
                            <MenuItem
                              icon={Power}
                              label={poll.is_active ? "Close voting" : "Reopen voting"}
                              onClick={() => handleTogglePollStatus(poll.id)}
                            />
                            <div className="my-1 h-px bg-jury-border-subtle" />
                            <MenuItem
                              icon={Trash2}
                              label="Delete poll"
                              danger
                              onClick={() => {
                                setDeleteConfirm(poll.id);
                                setOpenMenuId(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete confirm overlay */}
                    {deleteConfirm === poll.id && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-xl bg-jury-surface/95 backdrop-blur-sm">
                        <span className="text-[14px] text-jury-body">
                          Delete “{poll.question}”?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeletePoll(poll.id)}
                            className="rounded-full bg-jury-danger px-4 py-1.5 text-[13px] font-semibold text-white"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm("")}
                            className="rounded-full border border-jury-border-strong px-4 py-1.5 text-[13px] text-jury-body"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {showEmbedCode === poll.id && (
                      <div className="mt-4 border-t border-jury-border-subtle pt-4">
                        <EmbedCodeGenerator pollCode={poll.code} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

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
    </div>
  );
}

function Stat({ value, label, emerald }: { value: number; label: string; emerald?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-[18px] font-bold ${emerald ? "text-jury-emerald" : "text-jury-text"}`}>
        {value}
      </span>
      <span className="text-[13px] text-jury-muted">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="hidden h-[26px] w-px bg-jury-border-subtle sm:block" />;
}

function MenuItem({
  icon: Icon,
  label,
  href,
  onClick,
  danger,
}: {
  icon: typeof Eye;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const cls = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition ${
    danger
      ? "text-jury-danger hover:bg-jury-danger/10"
      : "text-jury-body hover:bg-white/[0.04]"
  }`;
  const inner = (
    <>
      <Icon size={15} /> {label}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function EmptyState() {
  const starters = [
    { icon: Sparkles, label: "Feedback survey" },
    { icon: Users, label: "Team retro" },
    { icon: FileText, label: "Event RSVP" },
  ];
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-jury-border-strong p-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(500px 200px at 50% 0%, rgba(16,185,129,0.08), transparent 70%)",
        }}
      />
      <div className="relative">
        <IconTile icon={FileText} className="mx-auto h-[52px] w-[52px]" iconSize={24} />
        <h2 className="mt-4 font-display text-2xl text-jury-text">No polls yet</h2>
        <p className="mt-2 text-[15px] text-jury-muted">
          Create your first poll and share it in seconds.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-jury-emerald px-5 text-[14px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
          >
            <Plus size={17} /> Create your first poll
          </Link>
          <Link
            href="/templates"
            className="inline-flex h-10 items-center justify-center rounded-full border border-jury-border-strong px-5 text-[14px] font-medium text-jury-body transition hover:border-white/25"
          >
            Start from a template
          </Link>
        </div>
        <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-3">
          {starters.map((s) => (
            <Link
              key={s.label}
              href="/templates"
              className="rounded-xl border border-jury-border bg-jury-surface p-4 text-left transition hover:border-white/[0.12]"
            >
              <IconTile icon={s.icon} className="h-[38px] w-[38px]" iconSize={18} />
              <p className="mt-3 text-[13px] font-medium text-jury-body">{s.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
