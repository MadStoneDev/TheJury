// /embed/[pollCode]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
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
  const [ownerTier, setOwnerTier] = useState<string>("free");

  // Determine target origin for postMessage
  useEffect(() => {
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
    if (document.referrer) {
      try {
        const url = new URL(document.referrer);
        setTargetOrigin(url.origin);
        return;
      } catch {
        // invalid referrer, fall through
      }
    }
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

    resizeIframe();
    const observer = new ResizeObserver(resizeIframe);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [targetOrigin]);

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

        // Fetch poll owner's subscription tier for branding
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", pollData.user_id)
          .single();
        if (ownerProfile?.subscription_tier) {
          setOwnerTier(ownerProfile.subscription_tier);
        }

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
      <div className="p-4 bg-background min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-background min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-destructive text-lg">!</span>
          </div>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="bg-background p-4 font-sans">
      {/* Compact poll header */}
      <div className="mb-4">
        <h2 className="text-lg font-display text-foreground mb-1">
          {poll.question}
        </h2>
        {poll.description && (
          <p className="text-muted-foreground text-sm mb-2">
            {poll.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          {totalVoters} {totalVoters === 1 ? "vote" : "votes"}
        </div>
      </div>

      {hasVotedFlag ? (
        /* Compact Results View */
        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IconCheck size={14} className="text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Thanks for voting!
            </p>
          </div>

          {results.map((result) => {
            const percentage = getPercentage(result.vote_count);
            const isJustVotedFor = justVotedFor.includes(result.option_id);
            return (
              <div key={result.option_id}>
                <div
                  className={`relative flex justify-between items-center p-3 rounded-lg overflow-hidden ${
                    isJustVotedFor
                      ? "bg-emerald-500/5 border border-emerald-500/30"
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative flex items-center gap-1.5">
                    {isJustVotedFor && (
                      <IconCheck size={14} className="text-emerald-500" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {result.option_text}
                    </span>
                  </div>
                  <div className="relative font-bold text-sm text-foreground">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Voting View */
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center mb-3">
            {poll.allow_multiple
              ? "Select all that apply:"
              : "Choose one option:"}
          </p>

          {poll.options?.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionToggle(option.id)}
                className={`w-full flex items-center p-3 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mr-2.5 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && (
                    <IconCheck className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {option.text}
                </span>
              </button>
            );
          }) || <div className="text-muted-foreground">No options available</div>}

          <div className="pt-2 text-center">
            <button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow-emerald"
            >
              {isSubmitting ? "Voting..." : "Vote"}
            </button>
          </div>
        </div>
      )}

      {/* Compact footer — only shown for free tier */}
      {ownerTier === "free" && (
        <div className="text-center mt-4 pt-3 border-t border-border">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || "https://thejury.app"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
          >
            Powered by TheJury
          </a>
        </div>
      )}
    </div>
  );
}
