// app/email/follow-ups/page.tsx
"use client";

import { useReminders, useUpdateReminder } from "@/lib/hooks/use-reminders";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";

// Same avatar color logic as your EmailList component
function getAvatarStyle(email: string) {
  const char = email.charAt(0).toUpperCase();
  if (["A", "B", "C"].includes(char))
    return "bg-[#1a3d2e] text-[#4ade80] border-[#22523e]";
  if (["S", "U", "V"].includes(char))
    return "bg-[#1e3a5f] text-[#60a5fa] border-[#284d7d]";
  if (["R", "P", "Q"].includes(char))
    return "bg-[#3b2a59] text-[#c084fc] border-[#4b3570]";
  if (["T", "W", "Y"].includes(char))
    return "bg-[#4a3f1d] text-[#facc15] border-[#5c4f24]";
  return "bg-gray-800 text-gray-300 border-gray-700";
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-blue-900/30 text-blue-400 border-blue-700",
    fired: "bg-orange-900/30 text-orange-400 border-orange-700",
    replied: "bg-green-900/30 text-green-400 border-green-700",
    dismissed: "bg-gray-800 text-gray-400 border-gray-700",
  };

  return (
    <span
      className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${
        styles[status as keyof typeof styles] || "bg-gray-800 text-gray-400"
      }`}
    >
      {status}
    </span>
  );
}

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: reminders, isLoading, error } = useReminders(statusFilter ?? undefined);
  const dismissMutation = useUpdateReminder();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1116] text-white overflow-y-auto">
      <div className="p-8 pb-4 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Follow-ups</h1>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b border-gray-800 pb-3 mb-6 overflow-x-auto">
          <Link
            href="/email/inbox"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <span>Inbox</span>
          </Link>
          <Link
            href="/email/sent"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Sent</span>
          </Link>
          <Link
            href="/email/drafts"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Drafts</span>
          </Link>
          <Link
            href="/email/follow-ups"
            className="flex items-center space-x-2 text-[#5c4dff] font-medium px-4 py-2 bg-[#5c4dff]/10 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Follow-ups</span>
          </Link>
          <Link
            href="/email/archives"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8"
              />
            </svg>
            <span>Archives</span>
          </Link>
          <Link
            href="/email/trash"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Trash</span>
          </Link>
        </div>

        {/* Filter pills (status filters) */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { key: null, label: "All" },
            { key: "pending", label: "Pending" },
            { key: "fired", label: "Fired" },
            { key: "replied", label: "Replied" },
            { key: "dismissed", label: "Dismissed" },
          ].map(({ key, label }) => (
            <button
              key={key ?? "all"}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === key
                  ? "bg-[#5c4dff] text-white border-[#5c4dff]"
                  : "bg-[#151821] text-[#8b949e] border-gray-800 hover:border-gray-700 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reminders list (matching EmailList card design) */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-[#8b949e]">
            Loading reminders...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500 bg-[#151821] rounded-xl border border-gray-800">
            Failed to load reminders.
          </div>
        ) : reminders?.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-[#8b949e] bg-[#151821] rounded-xl border border-gray-800">
            No reminders found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reminders!.map((reminder) => {
              const isDismissed = reminder.status === "dismissed";
              const isReplied = reminder.status === "replied";
              const isFired = reminder.status === "fired";
              const isPending = reminder.status === "pending";

              return (
                <div
                  key={reminder.id}
                  className={`flex gap-4 p-5 bg-[#151821] border border-gray-800/80 rounded-2xl hover:border-gray-700 hover:bg-[#1a1d27] transition-all group ${
                    isDismissed ? "opacity-60" : ""
                  }`}
                >
                  {/* Avatar from recipient email */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold flex-shrink-0 border ${getAvatarStyle(
                      reminder.recipientEmail
                    )}`}
                  >
                    {reminder.recipientEmail.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-gray-200 text-sm truncate">
                        {reminder.subject || "(No subject)"}
                      </div>
                      <StatusBadge status={reminder.status} />
                    </div>

                    <div className="text-xs text-[#8b949e]">
                      Waiting for reply from{" "}
                      <span className="text-gray-300">{reminder.recipientEmail}</span>
                    </div>

                    {reminder.sentAt && (
                      <div className="text-xs text-[#8b949e]">
                        Sent: {format(new Date(reminder.sentAt), "MMM d, yyyy h:mm a")}
                      </div>
                    )}
                    <div className="text-xs text-[#8b949e]">
                      Remind after: {format(new Date(reminder.remindAfter), "MMM d, yyyy h:mm a")}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                      <Link
                        href={`/email/sent/${reminder.threadId}`}
                        className="text-xs text-[#5c4dff] hover:text-[#7c6dff] transition-colors"
                      >
                        View Thread
                      </Link>
                      {(isFired || isPending) && (
                        <button
                          onClick={() =>
                            dismissMutation.mutate({ id: reminder.id, status: "dismissed" })
                          }
                          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      )}
                      {isReplied && (
                        <span className="text-xs text-green-400">✅ Replied</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Optional count at bottom */}
        {reminders && reminders.length > 0 && (
          <p className="text-xs text-[#8b949e] text-center pt-6">
            {reminders.length} reminder{reminders.length !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>
    </div>
  );
}