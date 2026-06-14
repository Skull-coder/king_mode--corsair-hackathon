import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Reminder {
  id: string;
  userId: string;
  threadId: string;
  sentMessageId: string;
  sentAt: string;
  remindAfter: string;
  recipientEmail: string;
  subject?: string;
  status: "pending" | "fired" | "dismissed" | "replied";
  createdAt: string;
}

// Fetch reminders (optionally filtered by status)
export function useReminders(status?: string) {
  return useQuery<Reminder[]>({
    queryKey: ["reminders", { status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/reminders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    },
  });
}

// Create a new reminder
export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      threadId: string;
      sentMessageId: string;
      sentAt: string;
      remindAfter: string;
      recipientEmail: string;
      subject?: string;
    }) =>
      fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create reminder");
        return res.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

// Update reminder status (dismiss / mark as read, etc.)
export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update reminder");
        return res.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}