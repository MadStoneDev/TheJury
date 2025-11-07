"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/Container";
import {
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconShare,
  IconUsers,
  IconChartBar,
} from "@tabler/icons-react";
import {
  getPollByCode,
  getPollResults,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PollResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [copiedText, setCopiedText] = useState<string>("");

  useEffect(() => {
    const loadPollResults = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        // Get current user to check ownership
        const user = await getCurrentUser();

        // Fetch poll data
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        // Check if current user owns this poll
        if (user && pollData.user_id === user.id) {
          // setIsOwner(true);
        } else {
          // If not the owner and poll is not public, restrict access
          // You can modify this logic based on your privacy requirements
          setError("You don't have permission to view these results");
          return;
        }

        setPoll(pollData);

        // Load results and total voter count
        const pollResults = await getPollResults(pollData.id);
        setResults(pollResults);

        // Get total number of unique voters
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

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/answer/${pollCode}`;
      await navigator.clipboard.writeText(link);
      setCopiedText("link");
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading poll results...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href={`/dashboard`}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center space-x-2"
            >
              <IconArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!poll) return null;

  const maxVotes = Math.max(...results.map((r) => r.vote_count));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header with Navigation */}
          <div className="mb-8">
            <Link
              href={`/dashboard`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <IconArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Poll Info Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 mb-4 lg:mb-0">
                <div className="flex items-center space-x-3 mb-4">
                  <IconChartBar size={24} className="text-emerald-700" />
                  <h1 className="text-3xl font-bold text-gray-900">
                    Poll Results
                  </h1>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {poll.question}
                </h2>

                {poll.description && (
                  <p className="text-gray-600 mb-4">{poll.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-2">
                      {pollCode}
                    </span>
                    Poll Code
                  </span>
                  <span className="flex items-center">
                    <IconUsers size={16} className="mr-1" />
                    {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
                  </span>
                  <span>Created {formatDate(poll.created_at)}</span>
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy poll code"
                >
                  {copiedText === "code" ? (
                    <IconCheck size={18} className="text-green-600" />
                  ) : (
                    <IconCopy size={18} />
                  )}
                  <span className="text-sm">Copy Code</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy poll link"
                >
                  {copiedText === "link" ? (
                    <IconCheck size={18} className="text-green-600" />
                  ) : (
                    <IconShare size={18} />
                  )}
                  <span className="text-sm">Copy Link</span>
                </button>

                <Link
                  href={`/answer/${pollCode}`}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                  View Poll
                </Link>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Detailed Results
            </h3>

            {totalVoters === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🗳️</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  No votes yet
                </h4>
                <p className="text-gray-600 mb-6">
                  Share your poll to start collecting votes!
                </p>
                <button
                  onClick={handleCopyLink}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <IconShare size={20} />
                  <span>Copy Poll Link</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((result) => {
                  const percentage = getPercentage(result.vote_count);
                  const isTopChoice =
                    result.vote_count === maxVotes && maxVotes > 0;

                  return (
                    <div
                      key={result.option_id}
                      className={`relative p-4 rounded-lg border-2 ${
                        isTopChoice
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg font-medium text-gray-900">
                              {result.option_text}
                            </span>
                            {isTopChoice && (
                              <span className="bg-emerald-700 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Leading
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Option #{result.option_order}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              isTopChoice ? "text-emerald-800" : "text-gray-900"
                            }`}
                          >
                            {percentage}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.vote_count}{" "}
                            {result.vote_count === 1 ? "vote" : "votes"}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            isTopChoice ? "bg-emerald-700" : "bg-emerald-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary Stats */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {totalVoters}
                      </div>
                      <div className="text-sm text-gray-600">Total Voters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {results.length}
                      </div>
                      <div className="text-sm text-gray-600">Options</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-800">
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
                      <div className="text-sm text-gray-600">Top Choice</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {poll.allow_multiple ? "Multi" : "Single"}
                      </div>
                      <div className="text-sm text-gray-600">Choice Type</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Actions */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Poll Management
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/edit/${pollCode}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Edit Poll
              </Link>
              <Link
                href={`/answer/${pollCode}`}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                View Voting Page
              </Link>
              <button
                onClick={handleCopyLink}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                {copiedText === "link" ? "Copied!" : "Share Poll"}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
