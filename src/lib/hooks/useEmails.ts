"use client";

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParsedEmail } from "@/lib/email";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailListResponse = {
  messages: ParsedEmail[];
  nextPageToken: string | null;
};

const API = "/api/emails";

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Infinite List (with pagination via pageToken) ────────────────────────────

export function useEmails(label: "INBOX" | "DRAFT" | "SENT") {
  return useInfiniteQuery<EmailListResponse>({
    queryKey: ["emails", label],
    queryFn: ({ pageParam }) =>
      fetchJSON(`${API}?label=${label}${pageParam ? `&pageToken=${pageParam}` : ""}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Archives ─────────────────────────────────────────────────────────────────

export function useArchiveEmails() {
  return useInfiniteQuery<EmailListResponse>({
    queryKey: ["emails", "archives"],
    queryFn: ({ pageParam }) =>
      fetchJSON(`${API}/archives${pageParam ? `?pageToken=${pageParam}` : ""}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Trash ────────────────────────────────────────────────────────────────────

export function useTrashEmails() {
  return useInfiniteQuery<EmailListResponse>({
    queryKey: ["emails", "trash"],
    queryFn: ({ pageParam }) =>
      fetchJSON(`${API}/trash${pageParam ? `?pageToken=${pageParam}` : ""}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Single email ─────────────────────────────────────────────────────────────

export function useEmail(messageId: string | null) {
  return useQuery<ParsedEmail>({
    queryKey: ["emails", "single", messageId],
    queryFn: () => fetchJSON(`${API}/${messageId}`),
    enabled: !!messageId,
  });
}

// ─── Thread ───────────────────────────────────────────────────────────────────

export function useThread(threadId: string | null) {
  return useQuery<{ id: string; messages: ParsedEmail[] }>({
    queryKey: ["threads", threadId],
    queryFn: () => fetchJSON(`/api/threads/${threadId}`),
    enabled: !!threadId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      threadId?: string;
      inReplyToMessageId?: string;
      references?: string;
    }) =>
      fetch(`${API}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["emails"] });
      if (variables.threadId) {
        qc.invalidateQueries({ queryKey: ["threads", variables.threadId] });
      }
    },
  });
}

export function useModifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      ...body
    }: {
      messageId: string;
      star?: boolean;
      read?: boolean;
      archive?: boolean;
      unarchive?: boolean;
      untrash?: boolean;
    }) =>
      fetch(`${API}/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

/**
 * Moves a message to Trash via DELETE → messages.trash().
 * Google does NOT allow permanent deletion via the API.
 */
export function useTrashEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      fetch(`${API}/${messageId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

/**
 * @deprecated Use useTrashEmail instead — Google doesn't allow permanent deletion.
 * Kept as an alias so existing callers continue to work without changes.
 */
export const useDeleteEmail = useTrashEmail;

// ─── Star ─────────────────────────────────────────────────────────────────────

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, starred }: { messageId: string; starred: boolean }) =>
      fetch(`${API}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, starred }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearchEmails(q: string) {
  return useInfiniteQuery<EmailListResponse>({
    queryKey: ["emails", "search", q],
    queryFn: ({ pageParam }) =>
      fetchJSON(
        `/api/emails/search?q=${encodeURIComponent(q)}${pageParam ? `&pageToken=${pageParam}` : ""}`
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    enabled: q.length > 0,
  });
}
