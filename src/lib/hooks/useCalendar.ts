"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const API = "/api/calendar/events";

export interface CalendarEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: { email?: string; displayName?: string };
  creator?: { email?: string; displayName?: string };
  recurrence?: string[];
  recurringEventId?: string;
  [key: string]: unknown;
}

type CalendarListResponse = {
  items?: CalendarEvent[];
  nextPageToken?: string;
};

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Infinite List (with pagination via pageToken) ────────────────────────────

export function useCalendarEvents(timeMin?: string, timeMax?: string, timeZone?: string) {
  return useInfiniteQuery<CalendarListResponse>({
    queryKey: ["calendar", { timeMin, timeMax, timeZone }],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (timeMin) params.set("timeMin", timeMin);
      if (timeMax) params.set("timeMax", timeMax);
      if (timeZone) params.set("timeZone", timeZone);
      if (pageParam) params.set("pageToken", pageParam as string);
      return fetchJSON(`${API}?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 1000,
  });
}

// ─── Single event ─────────────────────────────────────────────────────────────

export function useEvent(eventId: string | null) {
  return useQuery<CalendarEvent>({
    queryKey: ["calendar", "single", eventId],
    queryFn: () => fetchJSON(`${API}/${eventId}`),
    enabled: !!eventId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: CalendarEvent) =>
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ...event
    }: { eventId: string } & CalendarEvent) =>
      fetch(`${API}/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["calendar", "single", variables.eventId] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      fetch(`${API}/${eventId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

// ─── Availability ─────────────────────────────────────────────────────────────

export function useAvailability(timeMin?: string, timeMax?: string, timeZone?: string) {
  return useQuery({
    queryKey: ["calendar", "availability", { timeMin, timeMax, timeZone }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (timeMin) params.set("timeMin", timeMin);
      if (timeMax) params.set("timeMax", timeMax);
      if (timeZone) params.set("timeZone", timeZone);
      return fetchJSON(`/api/calendar/availability?${params.toString()}`);
    },
    enabled: !!timeMin && !!timeMax,
    staleTime: 30 * 1000,
  });
}
