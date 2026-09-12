"use client";

import { useEffect, useState } from "react";
import { IconCalendarPlus, IconDownload } from "@tabler/icons-react";

interface CalendarInfo {
  available: boolean;
  optionText?: string;
  date?: string;
  googleUrl?: string;
  icsUrl?: string;
}

/**
 * Shows an "Add to calendar" card for a scheduling poll's winning date.
 * Self-fetches the calendar route; renders nothing for non-scheduling polls.
 */
export function CalendarButton({ pollCode }: { pollCode: string }) {
  const [info, setInfo] = useState<CalendarInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/polls/${pollCode}/calendar?format=json`)
      .then((r) => r.json())
      .then((d) => !cancelled && setInfo(d))
      .catch(() => !cancelled && setInfo({ available: false }));
    return () => {
      cancelled = true;
    };
  }, [pollCode]);

  if (!info?.available) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 text-sm">
        <IconCalendarPlus size={18} className="text-emerald-500" />
        <span className="text-foreground">
          Leading night:{" "}
          <span className="font-semibold">{info.optionText}</span>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={info.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[13px] font-semibold text-white transition hover:bg-emerald-500"
        >
          <IconCalendarPlus size={15} />
          Add to Google Calendar
        </a>
        <a
          href={info.icsUrl}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[13px] font-medium text-foreground transition hover:bg-muted"
        >
          <IconDownload size={15} />
          Download .ics
        </a>
      </div>
    </div>
  );
}
