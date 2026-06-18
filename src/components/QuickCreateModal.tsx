"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateEvent } from "@/lib/hooks/useCalendar";
import { useCreateReminder } from "@/lib/hooks/use-reminders";
import { useHotkeys } from "react-hotkeys-hook";

type Tab = "draft" | "event";

type Attendee = {
  email: string;
  displayName?: string;
  responseStatus?: string;
};

const STATUS_DOT: Record<string, string> = {
  accepted: "🟢",
  tentative: "🟡",
  declined: "🔴",
  needsAction: "⚪",
};

const COLOR_SWATCHES = [
  { id: "1",  hex: "#a4bdfc", label: "Lavender" },
  { id: "2",  hex: "#7ae7bf", label: "Sage" },
  { id: "3",  hex: "#dbadff", label: "Grape" },
  { id: "4",  hex: "#ff887c", label: "Flamingo" },
  { id: "5",  hex: "#fbd75b", label: "Banana" },
  { id: "6",  hex: "#ffb878", label: "Tangerine" },
  { id: "7",  hex: "#46d6db", label: "Peacock" },
  { id: "8",  hex: "#e1e1e1", label: "Graphite" },
  { id: "9",  hex: "#5484ed", label: "Blueberry" },
  { id: "10", hex: "#51b749", label: "Basil" },
  { id: "11", hex: "#dc2127", label: "Tomato" },
];

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
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
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
  const [evColorId, setEvColorId] = useState("1");
  const [evVisibility, setEvVisibility] = useState("default");
  const [evTransparency, setEvTransparency] = useState("opaque");
  const [evAttendees, setEvAttendees] = useState<Attendee[]>([]);
  const [evNewAttendeeEmail, setEvNewAttendeeEmail] = useState("");

  // Keep end date >= start date
  useEffect(() => {
    if (evStartDate && evEndDate && evStartDate > evEndDate) {
      setEvEndDate(evStartDate);
    }
  }, [evStartDate, evEndDate]);

  // Reset helpers
  const resetDraft = () => {
    setTo("");
    setCc("");
    setBcc("");
    setShowCcBcc(false);
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
    setEvColorId("1");
    setEvVisibility("default");
    setEvTransparency("opaque");
    setEvAttendees([]);
    setEvNewAttendeeEmail("");
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
        body: JSON.stringify({ to, cc, bcc, subject, body }),
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
        body: JSON.stringify({ to, cc, bcc, subject, body }),
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

  const addAttendee = () => {
    const email = evNewAttendeeEmail.trim();
    if (!email) return;
    if (evAttendees.some((a) => a.email === email)) return;
    setEvAttendees([...evAttendees, { email, responseStatus: "needsAction" }]);
    setEvNewAttendeeEmail("");
  };

  const removeAttendee = (email: string) => {
    setEvAttendees(evAttendees.filter((a) => a.email !== email));
  };

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
        colorId: evColorId,
        visibility: evVisibility,
        transparency: evTransparency,
        attendees: evAttendees.map((a) => ({ email: a.email })),
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
  useHotkeys("escape", onClose, { enabled: isOpen });
  useHotkeys("right", () => setTab("event"), { enabled: isOpen });
  useHotkeys("left", () => setTab("draft"), { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-[#0e1116]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#151821] border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header + Tabs */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-800 flex-shrink-0">
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
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* ── Draft Form ──────────────────────────────────────────────────── */}
        {tab === "draft" && (
          <>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">To</label>
                <div className="relative">
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
                    placeholder="recipient@email.com"
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(!showCcBcc)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 pl-2 text-[#8b949e] hover:text-white transition-colors"
                    title="Add CC / BCC"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showCcBcc ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* CC / BCC dropdown */}
                <div
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    showCcBcc ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-medium text-[#8b949e] mb-1 uppercase tracking-wider">CC</label>
                      <input
                        type="text"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="cc@email.com"
                        className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#8b949e] mb-1 uppercase tracking-wider">BCC</label>
                      <input
                        type="text"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        placeholder="bcc@email.com"
                        className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Subject</label>
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
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Message</label>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      subjectRef.current?.focus();
                    }
                  }}
                  placeholder="Write your message..."
                  rows={6}
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm resize-none transition-colors"
                />
              </div>

              {/* Reminder collapsible */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showReminder ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border border-gray-800 rounded-lg bg-[#11141c] p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">
                      ⏱ Track for follow-up if no reply by…
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

            {/* Draft Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showReminder ? "Tracking On" : "Track Follow-up"}
                </button>
                <button
                  onClick={handleSendDraft}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Event Form ──────────────────────────────────────────────────── */}
        {tab === "event" && (
          <>
            <div className="p-5 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Title</label>
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
                  placeholder="Add title"
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                />
              </div>

              {/* Date & Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">Date & Time</label>
                  <label className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={evAllDay}
                      onChange={(e) => setEvAllDay(e.target.checked)}
                      className="accent-[#5c4dff] h-3.5 w-3.5"
                    />
                    All day
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 space-y-2">
                    <span className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">Start</span>
                    <input
                      type="date"
                      value={evStartDate}
                      onChange={(e) => setEvStartDate(e.target.value)}
                      className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                    />
                    {!evAllDay && (
                      <input
                        type="time"
                        value={evStartTime}
                        onChange={(e) => setEvStartTime(e.target.value)}
                        className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                      />
                    )}
                  </div>
                  <div className="bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 space-y-2">
                    <span className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">End</span>
                    <input
                      type="date"
                      value={evEndDate}
                      onChange={(e) => setEvEndDate(e.target.value)}
                      className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                    />
                    {!evAllDay && (
                      <input
                        type="time"
                        value={evEndTime}
                        onChange={(e) => setEvEndTime(e.target.value)}
                        className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Description</label>
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
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm resize-none transition-colors"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-2 uppercase tracking-wider">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEvColorId(c.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        evColorId === c.id
                          ? "border-white scale-110 shadow-lg"
                          : "border-transparent hover:border-gray-500"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Show as + Visibility */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Show as</label>
                  <select
                    value={evTransparency}
                    onChange={(e) => setEvTransparency(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="opaque">Busy</option>
                    <option value="transparent">Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Visibility</label>
                  <select
                    value={evVisibility}
                    onChange={(e) => setEvVisibility(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="confidential">Confidential</option>
                  </select>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-2 uppercase tracking-wider">Attendees</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={evNewAttendeeEmail}
                    onChange={(e) => setEvNewAttendeeEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                    placeholder="Add email"
                    className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
                  />
                  <button
                    onClick={addAttendee}
                    className="px-4 py-2 bg-[#5c4dff] text-white text-sm font-medium rounded-lg hover:bg-[#4b3be0] transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
                {evAttendees.length > 0 && (
                  <div className="space-y-1.5">
                    {evAttendees.map((a) => (
                      <div
                        key={a.email}
                        className="flex items-center gap-2.5 py-2 px-3 bg-[#0e1116] rounded-lg border border-gray-800 text-sm group"
                      >
                        <span className="text-xs">{STATUS_DOT[a.responseStatus || "needsAction"]}</span>
                        <span className="text-white flex-1 truncate text-sm">
                          {a.displayName || a.email}
                        </span>
                        <button
                          onClick={() => removeAttendee(a.email)}
                          className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={isCreatingEvent}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
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
