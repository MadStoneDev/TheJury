"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UseRealtimeVotesOptions {
  pollId: string | null;
  onNewVote: () => void;
}

export function useRealtimeVotes({ pollId, onNewVote }: UseRealtimeVotesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const callbackRef = useRef(onNewVote);

  // Keep callback ref in sync without resubscribing
  useEffect(() => {
    callbackRef.current = onNewVote;
  }, [onNewVote]);

  useEffect(() => {
    if (!pollId) return;

    const channel = supabase
      .channel(`votes:${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          callbackRef.current();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setConnectionError(null);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setConnectionError("Failed to connect to realtime updates");
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [pollId]);

  return { isConnected, connectionError };
}
