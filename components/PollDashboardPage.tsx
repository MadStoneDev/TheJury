"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import {
  IconPlus,
  IconEdit,
  IconEye,
  IconCopy,
  IconTrash,
  IconCheck,
  IconX,
  IconChartBar,
  IconCode,
} from "@tabler/icons-react";
import {
  getUserPolls,
  deletePoll,
  togglePollStatus,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import type { Poll } from "@/lib/supabaseHelpers";
import EmbedCodeGenerator from "@/components/EmbedCodeGenerator";

export default function PollDashboardPage() {
  // States
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string>("");
  const [showEmbedCode, setShowEmbedCode] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadPolls = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const userPolls = await getUserPolls(user.id);
        setPolls(userPolls);
      } catch (err) {
        console.error("Error loading polls:", err);
        setError("Failed to load polls");
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, [router]);

  const copyPollCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_SITE_URL}/answer/${code}`,
      );
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // const copyPollLink = async (code: string) => {
  //   try {
  //     const link = `${window.location.origin}/answer/${code}`;
  //     await navigator.clipboard.writeText(link);
  //     setCopiedCode(code);
  //     setTimeout(() => setCopiedCode(""), 2000);
  //   } catch (err) {
  //     console.error("Failed to copy link:", err);
  //   }
  // };

  const handleTogglePollStatus = async (pollId: string) => {
    try {
      const success = await togglePollStatus(pollId);
      if (success) {
        setPolls((prev) =>
          prev.map((poll) =>
            poll.id === pollId ? { ...poll, is_active: !poll.is_active } : poll,
          ),
        );
      } else {
        setError("Failed to update poll status");
      }
    } catch (err) {
      console.error("Error toggling poll status:", err);
      setError("Failed to update poll status");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const success = await deletePoll(pollId);
      if (success) {
        setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
        setDeleteConfirm("");
      } else {
        setError("Failed to delete poll");
      }
    } catch (err) {
      console.error("Error deleting poll:", err);
      setError("Failed to delete poll");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your polls...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 sm:py-8">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between xs:items-center gap-4 mb-8 transition-all duration-200 ease-in-out">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Polls
              </h1>
              <p className="text-gray-600">
                Manage and track all your polls in one place
              </p>
            </div>
            <Link
              href={`/create`}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              <IconPlus size={20} />
              <span>Create New Poll</span>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => setError("")}
                className="mt-2 text-sm text-red-500 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-gray-900">
                {polls.length}
              </div>
              <div className="text-sm text-gray-600">Total Polls</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-emerald-800">
                {polls.filter((p) => p.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Polls</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-gray-900">
                {polls.reduce((sum, p) => sum + (p.total_votes || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-gray-900">
                {polls.length > 0
                  ? Math.round(
                      polls.reduce((sum, p) => sum + (p.total_votes || 0), 0) /
                        polls.length,
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Votes/Poll</div>
            </div>
          </div>

          {/* Polls List */}
          {polls.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No polls yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first poll to get started!
              </p>
              <Link
                href={`/create`}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center space-x-2"
              >
                <IconPlus size={20} />
                <span>Create Your First Poll</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between lg:justify-start gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 max-w-[300px]">
                          {poll.question}
                        </h3>

                        <div className="flex items-center space-x-2">
                          {poll.allow_multiple && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Multiple Choice
                            </span>
                          )}
                          {poll.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {poll.description && (
                        <p className="text-gray-600 mb-2">{poll.description}</p>
                      )}

                      <div className="py-4 md:py-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-t border-b md:border-0 border-neutral-200 text-xs font-light text-gray-400">
                        <span>
                          Code:{" "}
                          <span className="font-mono font-semibold">
                            {poll.code}
                          </span>
                        </span>
                        <span>{poll.total_votes || 0} votes</span>
                        <span>Created {formatDate(poll.created_at)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 lg:max-w-[400px]">
                      {/* Copy Code */}
                      <button
                        onClick={() => copyPollCode(poll.code)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Copy poll code"
                      >
                        {copiedCode === poll.code ? (
                          <span className={`flex items-center gap-1 text-sm`}>
                            <IconCheck size={18} />
                            Copied
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 text-sm`}>
                            <IconCopy size={18} />
                            Copy Link
                          </span>
                        )}
                      </button>

                      {/* View Poll */}
                      <Link
                        href={`/answer/${poll.code}`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="View poll"
                      >
                        <span className={`flex items-center gap-1 text-sm`}>
                          <IconEye size={18} />
                          Go to Poll
                        </span>
                      </Link>

                      {/* View Results - NEW */}
                      <Link
                        href={`/dashboard/results/${poll.code}`}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="View detailed results"
                      >
                        <span className={`flex items-center gap-1 text-sm`}>
                          <IconChartBar size={18} />
                          See Analytics
                        </span>
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/edit/${poll.code}`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Edit poll"
                      >
                        <span className={`flex items-center gap-1 text-sm`}>
                          <IconEdit size={18} />
                          Edit Poll
                        </span>
                      </Link>

                      {/* Embed Code */}
                      <button
                        onClick={() =>
                          setShowEmbedCode(
                            showEmbedCode === poll.id ? "" : poll.id,
                          )
                        }
                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                        title="Get embed code"
                      >
                        <span className={`flex items-center gap-1 text-sm`}>
                          <IconCode size={18} />
                          Embed Code
                        </span>
                      </button>

                      {/* Toggle Active/Inactive */}
                      <button
                        onClick={() => handleTogglePollStatus(poll.id)}
                        className={`p-2 rounded transition-colors ${
                          poll.is_active
                            ? "text-emerald-700 hover:text-emerald-700 hover:bg-emerald-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          poll.is_active ? "Deactivate poll" : "Activate poll"
                        }
                      >
                        {poll.is_active ? (
                          <span className={`flex items-center gap-1 text-sm`}>
                            <IconCheck size={18} /> Poll is active
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 text-sm`}>
                            <IconX size={18} />
                            Poll is inactive
                          </span>
                        )}
                      </button>

                      {/* Delete */}
                      {deleteConfirm === poll.id ? (
                        <div className="absolute top-0 bottom-0 left-0 right-0 flex flex-col justify-center items-center space-y-2 bg-white/90">
                          <span className={`text-neutral-900 text-sm`}>
                            Are you sure you want to delete this poll?
                          </span>
                          <div
                            className={`flex justify-center items-center space-x-1 `}
                          >
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-sm"
                              title="Confirm delete"
                            >
                              Yes, chop it
                            </button>
                            <button
                              onClick={() => setDeleteConfirm("")}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm"
                              title="Cancel"
                            >
                              Wait, no. Scratch that
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(poll.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete poll"
                        >
                          <span className={`flex items-center gap-1 text-sm`}>
                            <IconTrash size={18} />
                            Delete Poll
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Embed Code Generator - Shows when toggled */}
                  {showEmbedCode === poll.id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <EmbedCodeGenerator pollCode={poll.code} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/create`}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create New Poll
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
