"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Connects to /api/sse and listens for "refresh" events.
 * When a refresh event arrives, invalidates all TanStack Query caches
 * so the UI refetches fresh data from Gmail/Calendar via Corsair.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;

    es.addEventListener("refresh", () => {
      // Invalidate all queries — frontend refetches only what's on screen
      queryClient.invalidateQueries();
    });

    es.onerror = () => {
      // EventSource auto-reconnects, no action needed
    };

    return () => {
      es.close();
    };
  }, [queryClient]);
}
