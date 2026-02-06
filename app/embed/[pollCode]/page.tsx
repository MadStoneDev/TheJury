// /embed/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import { supabase } from "@/lib/supabase";

export default function PollEmbedPage() {
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
  const [targetOrigin, setTargetOrigin] = useState("*");

  // Determine target origin for postMessage
  useEffect(() => {
    // Try ?origin= query param first
    const searchParams = new URLSearchParams(window.location.search);
    const originParam = searchParams.get("origin");
    if (originParam) {
      try {
        const url = new URL(originParam);
        setTargetOrigin(url.origin);
        return;
      } catch {
        // invalid URL, fall through
      }
    }
    // Fall back to document.referrer
    if (document.referrer) {
      try {
        const url = new URL(document.referrer);
        setTargetOrigin(url.origin);
        return;
      } catch {
        // invalid referrer, fall through
      }
    }
    // Default remains "*"
  }, []);

  // Auto-resize iframe function
  useEffect(() => {
    const resizeIframe = () => {
      const height = document.documentElement.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: "resize", height: height },
          targetOrigin,
        );
      }
    };

    // Resize on load and when content changes
    resizeIframe();
    const observer = new ResizeObserver(resizeIframe);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [targetOrigin]);

  // [Include all your existing poll loading logic here - same as the original file]
  useEffect(() => {
    const loadPoll = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        if (!pollData.is_active) {
          setError("This poll is not currently active");
          return;
        }

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

        const pollResults = await getPollResults(pollData.id);
        setResults(pollResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", pollData.id);

        setTotalVoters(voterCount || 0);

        const user = await getCurrentUser();
        let voted = false;
        let userVotes: string[] = [];

        if (user) {
          voted = await hasUserVoted(pollData.id, user.id);
          if (voted) {
            userVotes = await getUserVotes(pollData.id, user.id);
          }
        } else {
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

  // [Include your existing vote handling logic]
  const handleOptionToggle = (optionId: string) => {
    if (poll?.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !poll) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      let success = false;

      if (user) {
        await submitVote(poll.id, selectedOptions, user.id);
        success = true;
      } else {
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
        const pollResults = await getPollResults(poll.id);
        setResults(pollResults);

        const { count: voterCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", poll.id);

        setTotalVoters(voterCount || 0);

        setJustVotedFor([...selectedOptions]);
        setHasVotedFlag(true);
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit vote. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="bg-white p-4 font-sans">
      {/* Compact poll header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {poll.question}
        </h2>
        {poll.description && (
          <p className="text-gray-600 text-sm mb-2">{poll.description}</p>
        )}
        <div className="text-xs text-gray-500">
          {totalVoters} {totalVoters === 1 ? "vote" : "votes"}
        </div>
      </div>

      {hasVotedFlag ? (
        /* Compact Results View */
        <div className="space-y-3">
          <div className="text-center mb-4">
            <div className="text-emerald-700 text-2xl mb-1">
              <IconCheck size={24} />
            </div>
            <p className="text-sm text-gray-600">Thanks for voting!</p>
          </div>

          {results.map((result) => {
            const isJustVotedFor = justVotedFor.includes(result.option_id);
            return (
              <div key={result.option_id} className="relative">
                <div
                  className={`flex justify-between items-center p-3 rounded ${
                    isJustVotedFor
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    {isJustVotedFor && (
                      <div className="mr-2 text-emerald-700">
                        <IconCheck size={16} />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {result.option_text}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {getPercentage(result.vote_count)}%
                    </div>
                  </div>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-emerald-700 h-1 rounded-full transition-all duration-500"
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
        /* Compact Voting View */
        <div className="space-y-3">
          <p className="text-xs text-gray-600 text-center mb-3">
            {poll.allow_multiple
              ? "Select all that apply:"
              : "Choose one option:"}
          </p>

          {poll.options?.map((option) => (
            <label
              key={option.id}
              className="flex items-center p-3 border border-gray-200 rounded hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
            >
              <input
                type={poll.allow_multiple ? "checkbox" : "radio"}
                name={poll.allow_multiple ? undefined : "poll-option"}
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => handleOptionToggle(option.id)}
                className="w-3 h-3 text-emerald-700 bg-gray-100 border-gray-300 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">
                {option.text}
              </span>
            </label>
          )) || <div>No options available</div>}

          <div className="pt-3 text-center">
            <button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded text-sm font-medium transition-colors"
            >
              {isSubmitting ? "Voting..." : "Vote"}
            </button>
          </div>
        </div>
      )}

      {/* Compact footer */}
      <div className="text-center mt-4 pt-3 border-t border-gray-100">
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL || "https://thejury.app"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-emerald-700 transition-colors"
        >
          Powered by TheJury
        </a>
      </div>
    </div>
  );
}
