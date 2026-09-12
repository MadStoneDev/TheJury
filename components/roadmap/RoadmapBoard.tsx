"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronUp, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { generateFingerprint } from "@/lib/supabaseHelpers";

export type RoadmapStatus = "planned" | "in_progress" | "completed";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: RoadmapStatus;
  votes: number;
  votedByMe: boolean;
}

export interface Suggestion {
  id: string;
  body: string;
  createdAt: string | null;
  username: string;
}

const COLUMNS: { key: RoadmapStatus; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Shipped" },
];

const GUEST_KEY = "thejury_roadmap_votes";

export default function RoadmapBoard({
  items: initialItems,
  isLoggedIn,
  isAdmin,
  suggestions,
}: {
  items: RoadmapItem[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  suggestions: Suggestion[] | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestText, setSuggestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const fingerprint = useRef<string>("");

  // Guests: identify with a device fingerprint and restore local vote state.
  useEffect(() => {
    if (isLoggedIn) return;
    try {
      fingerprint.current = generateFingerprint();
      const voted: string[] = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
      const set = new Set(voted);
      setItems((prev) => prev.map((it) => ({ ...it, votedByMe: set.has(it.id) })));
    } catch {
      /* ignore */
    }
  }, [isLoggedIn]);

  const persistGuest = (id: string, voted: boolean) => {
    try {
      const cur: string[] = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
      const set = new Set(cur);
      if (voted) set.add(id);
      else set.delete(id);
      localStorage.setItem(GUEST_KEY, JSON.stringify([...set]));
    } catch {
      /* ignore */
    }
  };

  const vote = async (id: string) => {
    const before = items;
    // optimistic
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, votedByMe: !it.votedByMe, votes: it.votes + (it.votedByMe ? -1 : 1) }
          : it,
      ),
    );
    try {
      const res = await fetch("/api/roadmap/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: id,
          fingerprint: isLoggedIn ? undefined : fingerprint.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, votedByMe: data.voted, votes: data.count } : it)),
      );
      if (!isLoggedIn) persistGuest(id, data.voted);
    } catch (err) {
      setItems(before); // revert
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    }
  };

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestText.trim().length < 3) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/roadmap/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: suggestText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Thanks — suggestion sent!");
      setSuggestText("");
      setSuggestOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-jury-base">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[36px] leading-[1.1] text-jury-text sm:text-[44px]">
              Roadmap
            </h1>
            <p className="mt-2 text-[16px] text-jury-muted">
              What&apos;s planned, in progress and shipped. Vote for what you want
              next — no account needed.
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && suggestions && (
              <button
                onClick={() => setAdminOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-jury-border-strong px-4 text-[14px] font-medium text-jury-body transition hover:border-white/25"
              >
                <MessageSquare size={16} /> Suggestions ({suggestions.length})
              </button>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => setSuggestOpen((o) => !o)}
                className="inline-flex h-10 items-center rounded-full bg-jury-emerald px-4 text-[14px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
              >
                Suggest a feature
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center rounded-full border border-jury-border-strong px-4 text-[14px] font-medium text-jury-body transition hover:border-white/25"
              >
                Sign in to suggest
              </Link>
            )}
          </div>
        </div>

        {isLoggedIn && suggestOpen && (
          <form
            onSubmit={submitSuggestion}
            className="mb-8 rounded-xl border border-jury-border bg-jury-surface p-4"
          >
            <textarea
              value={suggestText}
              onChange={(e) => setSuggestText(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What should we build next?"
              className="w-full resize-none rounded-[10px] border border-jury-border bg-jury-input p-3 text-[15px] text-jury-text outline-none placeholder:text-jury-dim focus:border-jury-emerald-line"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || suggestText.trim().length < 3}
                className="h-9 rounded-full bg-jury-emerald px-4 text-[13px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send suggestion"}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colItems = items
              .filter((it) => it.status === col.key)
              .sort((a, b) => b.votes - a.votes);
            return (
              <div key={col.key}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-jury-muted">
                    {col.label}
                  </h2>
                  <span className="text-[13px] text-jury-dim">{colItems.length}</span>
                </div>
                <div className="space-y-3">
                  {colItems.length === 0 && (
                    <p className="rounded-xl border border-dashed border-jury-border p-4 text-center text-[13px] text-jury-dim">
                      Nothing here yet.
                    </p>
                  )}
                  {colItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex gap-3 rounded-xl border border-jury-border bg-jury-surface p-4"
                    >
                      <button
                        onClick={() => vote(it.id)}
                        aria-label={it.votedByMe ? "Remove your vote" : "Vote"}
                        className={`flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] border text-[13px] font-semibold transition ${
                          it.votedByMe
                            ? "border-jury-emerald-line bg-jury-emerald-tint text-jury-emerald"
                            : "border-jury-border-strong text-jury-muted hover:border-white/25 hover:text-jury-text"
                        }`}
                      >
                        <ChevronUp size={16} strokeWidth={2.5} />
                        {it.votes}
                      </button>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-jury-text">
                          {it.title}
                        </h3>
                        {it.description && (
                          <p className="mt-1 text-[13px] leading-relaxed text-jury-muted">
                            {it.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin suggestions modal */}
      {adminOpen && suggestions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAdminOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-jury-border bg-jury-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-jury-border-subtle p-4">
              <h3 className="text-[15px] font-semibold text-jury-text">
                Suggestions ({suggestions.length})
              </h3>
              <button
                onClick={() => setAdminOpen(false)}
                aria-label="Close"
                className="text-jury-muted hover:text-jury-text"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {suggestions.length === 0 && (
                <p className="text-center text-[13px] text-jury-dim">No suggestions yet.</p>
              )}
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[10px] border border-jury-border bg-jury-surface p-3"
                >
                  <div className="mb-1 flex items-center justify-between text-[12px] text-jury-dim">
                    <span>@{s.username}</span>
                    <span>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[14px] text-jury-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
