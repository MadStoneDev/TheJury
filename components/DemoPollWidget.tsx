﻿"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader } from "lucide-react";
import { generateFingerprint } from "@/lib/supabaseHelpers";
import { safeJsonParse } from "@/lib/jsonUtils";

// Types based on your Supabase schema
interface DemoPoll {
  id: string;
  question: string;
  description: string | null;
  options: Array<{ id: string; text: string }>;
  category: string | null;
  is_active: boolean | null;
}

interface DemoPollResult {
  option_id: string;
  option_text: string;
  vote_count: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Demo poll API functions
const demoPollAPI = {
  async getRandomDemoPoll(): Promise<DemoPoll> {
    console.log("Fetching random demo poll");
    const response = await fetch("/api/demo-polls/random");
    console.log("Response:", response);

    if (!response.ok) throw new Error("Failed to fetch demo poll");
    return response.json();
  },

  async getDemoPollResults(pollId: string): Promise<DemoPollResult[]> {
    const response = await fetch(`/api/demo-polls/${pollId}/results`);
    if (!response.ok) throw new Error("Failed to fetch results");
    return response.json();
  },

  async submitDemoVote(
    pollId: string,
    selectedOptions: string[],
    voterFingerprint: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch("/api/demo-polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demo_poll_id: pollId,
        selected_options: selectedOptions,
        voter_fingerprint: voterFingerprint,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit vote");
    }
    return response.json();
  },

  async hasVoted(pollId: string, voterFingerprint: string): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/demo-polls/${pollId}/has-voted?fingerprint=${voterFingerprint}`,
      );
      if (!response.ok) return false;

      try {
        const data = await response.json();
        return data.hasVoted;
      } catch (parseError) {
        console.error("Error parsing vote status response:", parseError);
        return false;
      }
    } catch (error) {
      console.error("Error checking vote status:", error);
      return false;
    }
  },
};

const DemoPollWidget: React.FC = () => {
  const [demoPoll, setDemoPoll] = useState<DemoPoll | null>(null);
  const [results, setResults] = useState<DemoPollResult[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [voterFingerprint, setVoterFingerprint] = useState<string>("");

  useEffect(() => {
    const initializeDemoPoll = async () => {
      await loadDemoPoll();
    };

    initializeDemoPoll();
  }, []);

  useEffect(() => {
    setVoterFingerprint(generateFingerprint());
  }, []);

  const loadDemoPoll = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get random demo poll
      const poll = await demoPollAPI.getRandomDemoPoll();
      setDemoPoll(poll);

      // Check if user has already voted
      const voted = await demoPollAPI.hasVoted(poll.id, voterFingerprint);
      setHasVoted(voted);

      if (voted) {
        // Load results if already voted
        const pollResults = await demoPollAPI.getDemoPollResults(poll.id);
        setResults(pollResults || []);
      }
    } catch (err) {
      console.error("Error loading demo poll:", err);
      setError(err instanceof Error ? err.message : "Failed to load demo poll");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (optionId: string): Promise<void> => {
    if (hasVoted || isVoting || !optionId || !demoPoll) return;

    try {
      setIsVoting(true);
      setError(null);

      // Submit vote
      console.log(
        "Submitting vote for poll:",
        demoPoll.id,
        "option:",
        optionId,
      );
      await demoPollAPI.submitDemoVote(
        demoPoll.id,
        [optionId],
        voterFingerprint,
      );

      // Update state
      setSelectedOption(optionId);
      setHasVoted(true);

      // Load updated results with retry logic
      console.log("Fetching updated results...");
      try {
        const pollResults = await demoPollAPI.getDemoPollResults(demoPoll.id);
        setResults(pollResults || []);
        console.log("Results loaded successfully:", pollResults);
      } catch (resultsError) {
        console.error("Error fetching results after vote:", resultsError);
        // Don't fail the whole vote process if results fail
        // The vote was successful, just show a message about results
        setError(
          "Vote submitted successfully, but couldn't load updated results. Please refresh to see results.",
        );
      }
    } catch (err) {
      console.error("Error voting:", err);
      setError(err instanceof Error ? err.message : "Failed to submit vote");
      // Reset voting state if vote failed
      setHasVoted(false);
      setSelectedOption(null);
    } finally {
      setIsVoting(false);
    }
  };

  const tryNewPoll = async (): Promise<void> => {
    setHasVoted(false);
    setSelectedOption(null);
    setResults([]);
    await loadDemoPoll();
  };

  const totalVotes = results.reduce(
    (sum: number, result: DemoPollResult) => sum + (result.vote_count || 0),
    0,
  );

  const getPercentage = (votes: number): number =>
    totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading demo poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDemoPoll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!demoPoll) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center text-gray-500">No demo polls available</div>
      </div>
    );
  }

  const options: Array<{ id: string; text: string }> = safeJsonParse(
    demoPoll.options,
    [],
  );

  if (!options.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center text-gray-500">
          No poll options available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full mb-4">
          Live Demo Poll
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {demoPoll.question}
        </h3>
        {demoPoll.description && (
          <p className="text-gray-600">{demoPoll.description}</p>
        )}
      </div>

      {!hasVoted ? (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isVoting}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-3 group-hover:border-emerald-500"></div>
                <span className="font-medium text-gray-900">{option.text}</span>
              </div>
            </button>
          ))}

          {isVoting && (
            <div className="text-center text-emerald-600 font-medium">
              <Loader className="w-4 h-4 animate-spin inline mr-2" />
              Submitting vote...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-8">
            <Check className="w-6 h-6" />
            Thanks for voting!
          </div>

          {results.map((result) => {
            const percentage = getPercentage(result.vote_count);
            const isSelected = result.option_id === selectedOption;

            return (
              <div
                key={result.option_id}
                className={`p-3 rounded-lg border-2 ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-neutral-900">
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 mr-2" />
                    )}
                    <span className="font-medium">{result.option_text}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{percentage}%</div>
                    <div className="text-sm text-gray-500">
                      {result.vote_count}{" "}
                      {result.vote_count === 1 ? "vote" : "votes"}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      isSelected ? "bg-emerald-600" : "bg-emerald-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="text-center pt-4">
            <button
              onClick={tryNewPoll}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
            >
              Try another poll →
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Total votes: {totalVotes} • This is a live demo using real data
        </p>
      </div>
    </div>
  );
};

export default DemoPollWidget;
