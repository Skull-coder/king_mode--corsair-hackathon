"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api/drafts";

type DraftListResponse = {
  drafts?: { id?: string; message?: any }[];
  nextPageToken?: string;
};

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useDrafts() {
  return useInfiniteQuery<DraftListResponse>({
    queryKey: ["drafts"],
    queryFn: ({ pageParam }) =>
      fetchJSON(`${API}${pageParam ? `?pageToken=${pageParam}` : ""}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      threadId?: string;
    }) =>
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      draftId,
      ...payload
    }: {
      draftId: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      threadId?: string;
    }) =>
      fetch(`${API}/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      fetch(`${API}/${draftId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useSendDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      fetch(`${API}/${draftId}/send`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}
