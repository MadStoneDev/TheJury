"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconTile } from "@/components/design/IconTile";
import { MessageSquare } from "lucide-react";

export default function LinkDiscordPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/discord/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Linked ${data.guildName} to your account.`);
        setCode("");
      } else {
        toast.error(data.error || "Failed to link server.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-jury-base">
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <IconTile icon={MessageSquare} className="mx-auto h-[52px] w-[52px]" iconSize={24} />
        <h1 className="mt-4 font-display text-[32px] text-jury-text">Link your Discord server</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-jury-muted">
          Run <code className="rounded bg-jury-input px-1.5 py-0.5 font-mono text-jury-body">/jury link</code>{" "}
          in your server, then paste the code below to attach it to this account.
          Polls created with the bot will show up in your dashboard.
        </p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD12"
            maxLength={12}
            className="h-12 rounded-[10px] border border-jury-border bg-jury-input text-center font-mono text-[18px] tracking-[0.2em] text-jury-text outline-none focus:border-jury-emerald-line"
          />
          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="h-11 rounded-full bg-jury-emerald text-[15px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi disabled:opacity-60"
          >
            {loading ? "Linking…" : "Link server"}
          </button>
        </form>
      </div>
    </div>
  );
}
