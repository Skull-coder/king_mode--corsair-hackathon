"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateEvent } from "@/lib/hooks/useCalendar";
import { useCreateReminder } from "@/lib/hooks/use-reminders";
import { useHotkeys } from "react-hotkeys-hook";

type Tab = "draft" | "event";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── Reminder chip selector (same as ReplyPanel) ─────────────────────────
function ReminderDropdown({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const options = [
    { label: "1 hour", value: "1h" },
    { label: "4 hours", value: "4h" },
    { label: "Tomorrow 9 AM", value: "tomorrow" },
    { label: "Monday 9 AM", value: "monday" },
    { label: "Custom…", value: "custom" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            selected === opt.value
              ? "bg-[#5c4dff] text-white border-[#5c4dff]"
              : "bg-[#1a1d27] text-[#8b949e] border-gray-700 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function QuickCreateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const toRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const evSummaryRef = useRef<HTMLInputElement>(null);
  const evLocationRef = useRef<HTMLInputElement>(null);
  const evDescriptionRef = useRef<HTMLTextAreaElement>(null);

  // Determine default tab from route
  const defaultTab: Tab = pathname.startsWith("/calendar") ? "event" : "draft";
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Auto‑focus the "To" field whenever the Draft tab is active and modal is open
  useEffect(() => {
    if (isOpen && tab === "draft") {
      const timer = setTimeout(() => toRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tab]);

  // Auto‑focus the Event title field when Event tab is active and modal is open
  useEffect(() => {
    if (isOpen && tab === "event") {
      const timer = setTimeout(() => evSummaryRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tab]);

  // ─── Draft form state ────────────────────────────────────────────────────
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Reminder state (draft only) ─────────────────────────────────────────
  const [showReminder, setShowReminder] = useState(false);
  const [remindOption, setRemindOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState("");
  const createReminder = useCreateReminder();

  // ─── Event form state ────────────────────────────────────────────────────
  const { mutate: createEvent, isPending: isCreatingEvent } = useCreateEvent();
  const [evSummary, setEvSummary] = useState("");
  const [evAllDay, setEvAllDay] = useState(false);
  const [evStartDate, setEvStartDate] = useState(toDateStr(new Date()));
  const [evStartTime, setEvStartTime] = useState(toTimeStr(new Date()));
  const [evEndDate, setEvEndDate] = useState(toDateStr(new Date()));
  const [evEndTime, setEvEndTime] = useState(
    toTimeStr(new Date(Date.now() + 3600000)),
  );
  const [evLocation, setEvLocation] = useState("");
  const [evDescription, setEvDescription] = useState("");

  // Reset helpers
  const resetDraft = () => {
    setTo("");
    setSubject("");
    setBody("");
    setShowReminder(false);
    setRemindOption(null);
    setCustomDate("");
  };
  const resetEvent = () => {
    const now = new Date();
    setEvSummary("");
    setEvAllDay(false);
    setEvStartDate(toDateStr(now));
    setEvStartTime(toTimeStr(now));
    setEvEndDate(toDateStr(now));
    setEvEndTime(toTimeStr(new Date(now.getTime() + 3600000)));
    setEvLocation("");
    setEvDescription("");
  };

  // Calculate remindAfter date from selected option
  const computeRemindAfter = (): Date | null => {
    if (!remindOption) return null;
    const now = new Date();
    switch (remindOption) {
      case "1h":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "4h":
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case "tomorrow":
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        return now;
      case "monday":
        now.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
        now.setHours(9, 0, 0, 0);
        return now;
      case "custom":
        return customDate ? new Date(customDate) : null;
      default:
        return null;
    }
  };

  // ─── Draft actions ───────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!to && !subject && !body) {
      addToast("error", "Cannot save an empty draft");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error("Failed to save");
      addToast("success", "Draft saved");
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      resetDraft();
      onClose();
    } catch {
      addToast("error", "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendDraft = async () => {
    if (!to) {
      addToast("error", "Please specify a recipient");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Save draft
      const draftRes = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!draftRes.ok) throw new Error("Failed to prepare");
      const draft = await draftRes.json();

      // 2. Send
      const sendRes = await fetch(`/api/drafts/${draft.id}/send`, {
        method: "POST",
      });
      if (!sendRes.ok) throw new Error("Failed to send");
      const sendResult = await sendRes.json(); // expected: { threadId, messageId }

      // 3. Create reminder if configured
      if (remindOption) {
        const remindAfter = computeRemindAfter();
        if (remindAfter) {
          createReminder.mutate({
            threadId: sendResult.threadId ?? "",
            sentMessageId: sendResult.messageId ?? "",
            sentAt: new Date().toISOString(),
            remindAfter: remindAfter.toISOString(),
            recipientEmail: to.trim(), // primary recipient
            subject: subject || "(No subject)",
          });
        }
      }

      addToast("success", "Email sent!");
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      resetDraft();
      onClose();
    } catch (err: any) {
      addToast("error", err.message || "Failed to send");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Event action ────────────────────────────────────────────────────────

  const handleCreateEvent = () => {
    if (!evSummary.trim()) {
      addToast("error", "Event title is required");
      return;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    createEvent(
      {
        summary: evSummary,
        description: evDescription,
        location: evLocation,
        start: evAllDay
          ? { date: evStartDate }
          : { dateTime: `${evStartDate}T${evStartTime}:00`, timeZone: tz },
        end: evAllDay
          ? { date: evEndDate }
          : { dateTime: `${evEndDate}T${evEndTime}:00`, timeZone: tz },
        transparency: "opaque",
      },
      {
        onSuccess: () => {
          addToast("success", "Event created");
          resetEvent();
          onClose();
        },
        onError: () => addToast("error", "Failed to create event"),
      },
    );
  };
  useHotkeys(
    "ctrl+enter",
    () => {
      if (tab === "event") handleCreateEvent();
      else if (tab === "draft") handleSendDraft();
    },
    { enabled: isOpen, enableOnFormTags: true },
  );
  useHotkeys("right", () => setTab("event"), { enabled: isOpen });
  useHotkeys("left", () => setTab("draft"), { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-[#0e1116]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#151821] border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header + Tabs */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex gap-1 bg-[#0e1116] rounded-lg p-1">
            <button
              onClick={() => setTab("draft")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "draft"
                  ? "bg-[#5c4dff] text-white"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setTab("event")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "event"
                  ? "bg-[#5c4dff] text-white"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              Event
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* ── Draft Form ──────────────────────────────────────────────────── */}
        {tab === "draft" && (
          <>
            <div className="p-5 space-y-4">
              <input
                ref={toRef}
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    subjectRef.current?.focus();
                  }
                }}
                placeholder="To: recipient@email.com"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />

              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    bodyRef.current?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    toRef.current?.focus();
                  }
                }}
                placeholder="Subject"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />

              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    subjectRef.current?.focus();
                  }
                  // ArrowDown stays natural (scrolls / moves cursor)
                }}
                placeholder="Write your message..."
                rows={6}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm resize-none"
              />

              {/* ─── Reminder collapsible section (same as ReplyPanel) ─── */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showReminder ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border border-gray-800 rounded-lg bg-[#11141c] p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">
                      ⏱ Remind me if no reply in…
                    </h4>
                    <button
                      onClick={() => {
                        setShowReminder(false);
                        setRemindOption(null);
                        setCustomDate("");
                      }}
                      className="text-xs text-[#8b949e] hover:text-gray-200"
                    >
                      Remove
                    </button>
                  </div>
                  <ReminderDropdown
                    selected={remindOption}
                    onSelect={setRemindOption}
                  />
                  {remindOption === "custom" && (
                    <input
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="mt-2 w-full bg-[#0e1116] text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c4dff]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ─── Footer (mirrors ReplyPanel layout) ─── */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-[#8b949e] hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={onClose}
                  className="text-sm text-[#8b949e] hover:text-gray-200 transition-colors"
                >
                  Discard
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReminder(!showReminder)}
                  className={`flex items-center px-3 py-2 rounded-lg gap-2 transition-all text-sm ${
                    showReminder
                      ? "bg-[#5c4dff] text-white"
                      : "text-[#8b949e] hover:text-gray-200 hover:bg-[#1a1d27]"
                  }`}
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
                  {showReminder ? "Reminder On" : "Add Reminder"}
                </button>
                <button
                  onClick={handleSendDraft}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Event Form (keyboard‑friendly) ────────────────────────── */}
        {tab === "event" && (
          <>
            <div className="p-5 space-y-4">
              {/* Title */}
              <input
                ref={evSummaryRef}
                type="text"
                value={evSummary}
                onChange={(e) => setEvSummary(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    evLocationRef.current?.focus();
                  }
                }}
                placeholder="Event title"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />

              {/* All‑day checkbox */}
              <label className="flex items-center gap-2 text-sm text-[#8b949e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={evAllDay}
                  onChange={(e) => setEvAllDay(e.target.checked)}
                  className="accent-[#5c4dff]"
                />
                All day
              </label>

              {/* Start / End dates (unchanged) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">
                    Start
                  </label>
                  <input
                    type="date"
                    value={evStartDate}
                    onChange={(e) => setEvStartDate(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
                  />
                  {!evAllDay && (
                    <input
                      type="time"
                      value={evStartTime}
                      onChange={(e) => setEvStartTime(e.target.value)}
                      className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">
                    End
                  </label>
                  <input
                    type="date"
                    value={evEndDate}
                    onChange={(e) => setEvEndDate(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
                  />
                  {!evAllDay && (
                    <input
                      type="time"
                      value={evEndTime}
                      onChange={(e) => setEvEndTime(e.target.value)}
                      className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]"
                    />
                  )}
                </div>
              </div>

              {/* Location */}
              <input
                ref={evLocationRef}
                type="text"
                value={evLocation}
                onChange={(e) => setEvLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    evDescriptionRef.current?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    evSummaryRef.current?.focus();
                  }
                }}
                placeholder="Add location"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />

              {/* Description */}
              <textarea
                ref={evDescriptionRef}
                value={evDescription}
                onChange={(e) => setEvDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    evLocationRef.current?.focus();
                  }
                }}
                placeholder="Add description"
                rows={3}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm resize-none"
              />
            </div>

            <div className="flex justify-end p-5 border-t border-gray-800">
              <button
                onClick={handleCreateEvent}
                disabled={isCreatingEvent}
                className="px-6 py-2 text-sm font-medium text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
              >
                {isCreatingEvent ? "Creating..." : "Create Event"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
