"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import {
  IconPlus,
  IconEdit,
  IconEye,
  IconCopy,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import {
  getUserPolls,
  deletePoll,
  togglePollStatus,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import type { Poll } from "@/lib/supabaseHelpers";

export default function PollDashboardPage() {
  // States
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string>("");
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
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const copyPollLink = async (code: string) => {
    try {
      const link = `${window.location.origin}/answer/${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Polls
              </h1>
              <p className="text-gray-600">
                Manage and track all your polls in one place
              </p>
            </div>
            <Link
              href="/create"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                href="/create"
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {poll.question}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {poll.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              Inactive
                            </span>
                          )}
                          {poll.allow_multiple && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Multiple Choice
                            </span>
                          )}
                        </div>
                      </div>

                      {poll.description && (
                        <p className="text-gray-600 mb-2">{poll.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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

                    <div className="flex items-center space-x-2">
                      {/* Copy Code */}
                      <button
                        onClick={() => copyPollCode(poll.code)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Copy poll code"
                      >
                        {copiedCode === poll.code ? (
                          <IconCheck size={18} />
                        ) : (
                          <IconCopy size={18} />
                        )}
                      </button>

                      {/* View Results */}
                      <Link
                        href={`/answer/${poll.code}`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="View poll"
                      >
                        <IconEye size={18} />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/edit/${poll.code}`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Edit poll"
                      >
                        <IconEdit size={18} />
                      </Link>

                      {/* Toggle Active/Inactive */}
                      <button
                        onClick={() => handleTogglePollStatus(poll.id)}
                        className={`p-2 rounded transition-colors ${
                          poll.is_active
                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          poll.is_active ? "Deactivate poll" : "Activate poll"
                        }
                      >
                        {poll.is_active ? (
                          <IconCheck size={18} />
                        ) : (
                          <IconX size={18} />
                        )}
                      </button>

                      {/* Delete */}
                      {deleteConfirm === poll.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDeletePoll(poll.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-xs"
                            title="Confirm delete"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm("")}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors text-xs"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(poll.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete poll"
                        >
                          <IconTrash size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create New Poll
              </Link>
              <button
                onClick={() =>
                  copyPollLink(polls.find((p) => p.is_active)?.code || "")
                }
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                disabled={!polls.find((p) => p.is_active)}
              >
                Share Latest Poll
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
