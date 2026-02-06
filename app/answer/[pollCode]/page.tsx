// answer/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/Container";
import { IconCheck } from "@tabler/icons-react";
import {
  getPollByCode,
  submitVote,
  hasUserVoted,
  getUserVotes,
  getPollResults,
  getCurrentUser,
  generateFingerprint,
} from "@/lib/supabaseHelpers";
import { toast } from "sonner";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PollAnswerPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVotedFlag, setHasVotedFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVotedFor, setJustVotedFor] = useState<string[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    const loadPoll = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        // Fetch poll data
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        if (!pollData.is_active) {
          setError("This poll is not currently active");
          return;
        }

        // Check time limits
        if (pollData.has_time_limit) {
          const now = new Date();
          if (pollData.start_date && new Date(pollData.start_date) > now) {
            setError("Voting has not started yet");
            return;
          }
          if (pollData.end_date && new Date(pollData.end_date) < now) {
            setError("Voting has ended");
            return;
          }
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

        // Then check if user has voted
        const user = await getCurrentUser();
        let voted = false;
        let userVotes: string[] = [];

        if (user) {
          // Authenticated user
          voted = await hasUserVoted(pollData.id, user.id);
          if (voted) {
            userVotes = await getUserVotes(pollData.id, user.id);
          }
        } else {
          // Anonymous user - check database with fingerprint only
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
        setError("Failed to load poll");
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollCode]);

  const handleOptionToggle = (optionId: string) => {
    if (poll?.allow_multiple) {
      // Multiple choice: toggle selection
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      // Single choice: replace selection
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !poll) return;

    setIsSubmitting(true);
    setError(null); // Clear any previous errors

    try {
      const user = await getCurrentUser();
      let success = false;

      if (user) {
        // Authenticated user
        await submitVote(poll.id, selectedOptions, user.id);
        success = true;
      } else {
        // Anonymous user
        const fingerprint = generateFingerprint();
        await submitVote(
          poll.id,
          selectedOptions,
          undefined,
          undefined,
          fingerprint,
        );
        success = true;
      }

      if (success) {
        // Load updated results and voter count
        const pollResults = await getPollResults(poll.id);
        setResults(pollResults);

        // Update voter count
        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id);

        setTotalVoters(voterCount || 0);

        setJustVotedFor([...selectedOptions]);
        setHasVotedFlag(true);
        toast.success("Vote submitted!");
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Failed to submit vote. Please try again.");
        toast.error("Failed to submit vote. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading poll...</p>
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
            <p className="text-sm text-gray-500 mb-6">
              Poll code:{" "}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {pollCode}
              </span>
            </p>
            <Link
              href="/"
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!poll) return null;

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Poll Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">
                Poll Code: {pollCode}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {poll.question}
              </h1>
              {poll.description && (
                <p className="text-lg text-gray-600">{poll.description}</p>
              )}
              <div className="text-sm text-gray-500 mt-4">
                {totalVoters} {totalVoters === 1 ? "person has" : "people have"}{" "}
                voted so far
              </div>
            </div>

            {hasVotedFlag ? (
              /* Results View */
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="text-emerald-700 text-5xl mb-2">
                    <IconCheck size={48} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Thanks for voting!
                  </h2>
                  <p className="text-gray-600">Here are the current results:</p>
                </div>

                {results.map((result) => {
                  const isJustVotedFor = justVotedFor.includes(
                    result.option_id,
                  );
                  return (
                    <div key={result.option_id} className="relative">
                      <div
                        className={`flex justify-between items-center p-4 rounded-lg ${
                          isJustVotedFor
                            ? "bg-emerald-50 border-2 border-emerald-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center">
                          {isJustVotedFor && (
                            <div className="mr-3 text-emerald-700">
                              <IconCheck size={20} />
                            </div>
                          )}
                          <span
                            className={`font-medium ${
                              isJustVotedFor
                                ? "text-emerald-900"
                                : "text-gray-900"
                            }`}
                          >
                            {result.option_text}
                            {isJustVotedFor && (
                              <span className="ml-2 text-sm text-emerald-700 font-semibold">
                                Your vote!
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold text-lg ${
                              isJustVotedFor
                                ? "text-emerald-800"
                                : "text-gray-900"
                            }`}
                          >
                            {getPercentage(result.vote_count)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.vote_count}{" "}
                            {result.vote_count === 1 ? "vote" : "votes"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isJustVotedFor ? "bg-emerald-700" : "bg-emerald-700"
                          }`}
                          style={{
                            width: `${getPercentage(result.vote_count)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Voting View */
              <div className="space-y-4">
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-600">
                    {poll.allow_multiple
                      ? "Select all that apply:"
                      : "Choose one option:"}
                  </p>
                </div>

                {poll.options?.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
                  >
                    <input
                      type={poll.allow_multiple ? "checkbox" : "radio"}
                      name={poll.allow_multiple ? undefined : "poll-option"}
                      value={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleOptionToggle(option.id)}
                      className="w-4 h-4 text-emerald-700 bg-gray-100 border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="ml-3 text-lg font-medium text-gray-900">
                      {option.text}
                    </span>
                  </label>
                )) || <div>No options available</div>}

                <div className="pt-6 text-center">
                  <button
                    onClick={handleVote}
                    disabled={selectedOptions.length === 0 || isSubmitting}
                    className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Cast Your Vote"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-500 mb-4">Powered by TheJury</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
