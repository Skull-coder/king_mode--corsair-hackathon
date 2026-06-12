"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api/calendar/events";

type CalendarListResponse = {
  items?: any[];
  nextPageToken?: string;
};

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useCalendarEvents(timeMin?: string, timeMax?: string) {
  const params = new URLSearchParams();
  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  return useInfiniteQuery<CalendarListResponse>({
    queryKey: ["calendar", timeMin, timeMax],
    queryFn: ({ pageParam }) => {
      if (pageParam) params.set("pageToken", pageParam as string);
      return fetchJSON(`${API}?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 1000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: any) =>
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...event }: { eventId: string } & any) =>
      fetch(`${API}/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      fetch(`${API}/${eventId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}
