"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/Container";
import { IconUsers, IconChartBar } from "@tabler/icons-react";
import { getPollByCode, getPollResults } from "@/lib/supabaseHelpers";
import type { Poll, PollResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PublicResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      if (!pollCode) return;

      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }

        // Check if results are publicly visible
        const pollWithSettings = pollData as Poll & {
          show_results_to_voters?: boolean;
        };
        if (pollWithSettings.show_results_to_voters === false) {
          setError("Results are not publicly available for this poll");
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
        console.error("Error loading results:", err);
        setError("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [pollCode]);

  const getPercentage = (votes: number) => {
    return totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
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
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error === "Poll not found" ? "Not Found" : "Results Unavailable"}
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
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

  const maxVotes = Math.max(...results.map((r) => r.vote_count));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <IconChartBar size={24} className="text-emerald-700" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Poll Results
                </h1>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {poll.question}
              </h2>
              {poll.description && (
                <p className="text-gray-600">{poll.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <IconUsers size={16} />
                <span>
                  {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
                </span>
              </div>
            </div>

            {/* Results */}
            {totalVoters === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🗳️</div>
                <p className="text-gray-600">No votes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const percentage = getPercentage(result.vote_count);
                  const isTopChoice =
                    result.vote_count === maxVotes && maxVotes > 0;

                  return (
                    <div key={result.option_id}>
                      <div
                        className={`flex justify-between items-center p-4 rounded-lg ${
                          isTopChoice
                            ? "bg-emerald-50 border-2 border-emerald-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center">
                          <span
                            className={`font-medium ${
                              isTopChoice ? "text-emerald-900" : "text-gray-900"
                            }`}
                          >
                            {result.option_text}
                            {isTopChoice && (
                              <span className="ml-2 text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                                Leading
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold text-lg ${
                              isTopChoice ? "text-emerald-800" : "text-gray-900"
                            }`}
                          >
                            {percentage}%
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
                            isTopChoice ? "bg-emerald-700" : "bg-emerald-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vote CTA */}
          <div className="text-center space-y-4">
            <Link
              href={`/answer/${pollCode}`}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-md font-medium transition-colors inline-block"
            >
              Vote on this poll
            </Link>
            <p className="text-gray-500 text-sm">Powered by TheJury</p>
          </div>
        </div>
      </Container>
    </div>
  );
}
