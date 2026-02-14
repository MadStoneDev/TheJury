"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  IconUsers,
  IconChartBar,
  IconLoader2,
} from "@tabler/icons-react";
import { getPollByCode, getPollResultsByQuestion } from "@/lib/supabaseHelpers";
import type { Poll, QuestionResult } from "@/lib/supabaseHelpers";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { QuestionTypeResults } from "@/components/question-types";
import { BarChart } from "@/components/charts";
import type { ChartDataItem } from "@/components/charts";

export default function PublicResultsPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);

  const isMultiQuestion = questionResults.length > 1;

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

        const pollWithSettings = pollData as Poll & {
          show_results_to_voters?: boolean;
        };
        if (pollWithSettings.show_results_to_voters === false) {
          setError("Results are not publicly available for this poll");
          return;
        }

        setPoll(pollData);

        const qResults = await getPollResultsByQuestion(pollData.id);
        setQuestionResults(qResults);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="rounded-2xl border bg-card p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-display text-foreground mb-2">
              {error === "Poll not found"
                ? "Not Found"
                : "Results Unavailable"}
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button variant="brand">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const toChartData = (results: { option_id: string; option_text: string; vote_count: number }[]): ChartDataItem[] =>
    results.map((r) => ({ label: r.option_text, value: r.vote_count, id: r.option_id }));

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Results Card */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-lg">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <IconChartBar size={20} className="text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Poll Results
                  </span>
                </div>
                <h1 className="text-2xl font-display text-foreground mb-2">
                  {poll.question}
                </h1>
                {poll.description && (
                  <p className="text-muted-foreground text-sm">
                    {poll.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <IconUsers size={14} />
                    {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
                  </span>
                  {isMultiQuestion && (
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                      {questionResults.length} questions
                    </span>
                  )}
                </div>
              </div>

              {/* Results */}
              {totalVoters === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <IconChartBar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No votes yet.
                  </p>
                </div>
              ) : isMultiQuestion ? (
                <div className="space-y-6">
                  {questionResults.map((qr) => {
                    const qType = qr.question_type || "multiple_choice";
                    return (
                      <div key={qr.question_id}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Q{qr.question_order}
                          </span>
                          <h3 className="font-semibold text-foreground text-sm">
                            {qr.question_text}
                          </h3>
                        </div>
                        {qType !== "multiple_choice" && qType !== "image_choice" ? (
                          <QuestionTypeResults
                            questionResult={qr}
                            totalVoters={totalVoters}
                          />
                        ) : (
                          <BarChart data={toChartData(qr.results)} total={totalVoters} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {questionResults[0] &&
                  questionResults[0].question_type !== "multiple_choice" &&
                  questionResults[0].question_type !== "image_choice" ? (
                    <QuestionTypeResults
                      questionResult={questionResults[0]}
                      totalVoters={totalVoters}
                    />
                  ) : (
                    <BarChart
                      data={toChartData(questionResults[0]?.results || [])}
                      total={totalVoters}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vote CTA */}
          <div className="text-center mt-6 space-y-3">
            <Link href={`/answer/${pollCode}`}>
              <Button variant="brand" size="lg">
                Vote on this poll
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <Link
                href="/"
                className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
              >
                TheJury
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
