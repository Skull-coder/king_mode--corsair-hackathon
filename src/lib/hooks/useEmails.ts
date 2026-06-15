"use client";

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParsedEmail } from "@/lib/email-parser";

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

export function useDeleteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      fetch(`${API}/${messageId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

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
