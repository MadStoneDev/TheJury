"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PollStateUpdate {
  live_state?: string;
  live_current_question?: number;
  is_active?: boolean;
}

interface UseRealtimePollStateOptions {
  pollId: string | null;
  enabled?: boolean;
  onStateChange: (update: PollStateUpdate) => void;
}

export function useRealtimePollState({
  pollId,
  enabled = true,
  onStateChange,
}: UseRealtimePollStateOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onStateChange);

  useEffect(() => {
    callbackRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!pollId || !enabled) return;

    const channel = supabase
      .channel(`poll-state:${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "polls",
          filter: `id=eq.${pollId}`,
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          callbackRef.current({
            live_state: newRecord.live_state as string | undefined,
            live_current_question: newRecord.live_current_question as number | undefined,
            is_active: newRecord.is_active as boolean | undefined,
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [pollId, enabled]);

  return { isConnected };
}
