"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconPrinter, IconLoader2 } from "@tabler/icons-react";
import {
  getPollByCode,
  getPollResultsByQuestion,
} from "@/lib/supabaseHelpers";
import type { Poll, QuestionResult } from "@/lib/supabaseHelpers";
import { supabase } from "@/lib/supabase";
import { formatDateFull } from "@/lib/dateUtils";

/**
 * Printable "results record" for the minutes. A clean, light-themed document
 * (regardless of the app theme) that the organiser prints or saves as a PDF via
 * the browser's print dialog. Captures the question, options, counts, response
 * total and the open/close times.
 */
export default function ResultsRecordPage() {
  const params = useParams();
  const pollCode = params.pollCode as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    const load = async () => {
      if (!pollCode) return;
      setIsLoading(true);
      try {
        const pollData = await getPollByCode(pollCode);
        if (!pollData) {
          setError("Poll not found");
          return;
        }
        setPoll(pollData);
        const [qResults, { count }] = await Promise.all([
          getPollResultsByQuestion(pollData.id, pollData.questions),
          supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", pollData.id),
        ]);
        setQuestionResults(qResults);
        setTotalResponses(count || 0);
      } catch (err) {
        console.error("Error loading results record:", err);
        setError("Failed to load the results record");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [pollCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error ?? "Not found"}</p>
          <Link
            href={`/dashboard/results/${pollCode}`}
            className="text-emerald-500 hover:text-emerald-400 font-medium text-sm"
          >
            Back to results
          </Link>
        </div>
      </div>
    );
  }

  const opened = poll.start_date || poll.created_at;
  const closed = poll.end_date
    ? formatDateFull(poll.end_date)
    : poll.is_active
      ? "Still open"
      : "Closed (no scheduled end)";

  const percent = (count: number) =>
    totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

  return (
    <>
      {/* Print rules: hide the app chrome + toolbar, force a clean light page. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .record-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          @page { margin: 18mm; }
        }
      `}</style>

      <div className="min-h-screen bg-muted/40 py-8 px-4 print:bg-white print:p-0">
        {/* Toolbar (screen only) */}
        <div className="no-print max-w-[820px] mx-auto mb-4 flex items-center justify-between">
          <Link
            href={`/dashboard/results/${pollCode}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to results
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 h-10 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <IconPrinter size={16} />
            Download / Print PDF
          </button>
        </div>

        {/* The record sheet — explicitly light so printed minutes are clean. */}
        <div className="record-sheet max-w-[820px] mx-auto bg-white text-neutral-900 rounded-lg shadow-lg border border-neutral-200 p-10 sm:p-12">
          <header className="flex items-start justify-between border-b border-neutral-200 pb-5 mb-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
                Results record
              </p>
              <h1 className="text-2xl font-semibold mt-1 leading-snug">
                {poll.question}
              </h1>
              {poll.description && (
                <p className="text-sm text-neutral-600 mt-1.5">
                  {poll.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 pl-6">
              <p className="text-lg font-bold text-emerald-600">TheJury</p>
              <p className="text-[11px] text-neutral-500">thejury.app</p>
            </div>
          </header>

          {/* Metadata */}
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-8">
            <Meta label="Poll code" value={poll.code} />
            <Meta
              label="Status"
              value={poll.is_active ? "Open for voting" : "Closed"}
            />
            <Meta label="Opened" value={formatDateFull(opened)} />
            <Meta label="Closed" value={closed} />
            <Meta label="Total responses" value={String(totalResponses)} />
            <Meta
              label="Eligible voters"
              value="Open link — anyone with the link or code"
            />
          </dl>

          {/* Results per question */}
          <div className="space-y-7">
            {questionResults.map((qr, qi) => {
              const questionTotal = qr.results.reduce(
                (s, r) => s + (r.vote_count || 0),
                0,
              );
              const maxCount = Math.max(
                ...qr.results.map((r) => r.vote_count || 0),
                0,
              );
              return (
                <section key={qr.question_id || qi}>
                  {questionResults.length > 1 && (
                    <h2 className="text-sm font-semibold text-neutral-800 mb-3">
                      {qi + 1}. {qr.question_text}
                    </h2>
                  )}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                        <th className="py-1.5 font-medium">Option</th>
                        <th className="py-1.5 font-medium text-right w-24">
                          Votes
                        </th>
                        <th className="py-1.5 font-medium text-right w-16">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qr.results.map((r) => {
                        const isTop =
                          (r.vote_count || 0) === maxCount && maxCount > 0;
                        return (
                          <tr
                            key={r.option_id}
                            className="border-b border-neutral-100"
                          >
                            <td className="py-2 pr-2">
                              {r.option_text}
                              {isTop && (
                                <span className="ml-2 text-[10px] font-semibold text-emerald-700">
                                  ▲ most votes
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right tabular-nums font-medium">
                              {r.vote_count || 0}
                            </td>
                            <td className="py-2 text-right tabular-nums text-neutral-600">
                              {totalResponses > 0
                                ? percent(r.vote_count || 0)
                                : 0}
                              %
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="text-[12px] text-neutral-500">
                        <td className="pt-2">
                          {questionTotal}{" "}
                          {questionTotal === 1 ? "response" : "responses"}
                        </td>
                        <td />
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </section>
              );
            })}
          </div>

          <footer className="mt-10 pt-4 border-t border-neutral-200 text-[11px] text-neutral-500 flex justify-between">
            <span>Generated by TheJury · thejury.app</span>
            <span>{formatDateFull(generatedAt)}</span>
          </footer>
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
