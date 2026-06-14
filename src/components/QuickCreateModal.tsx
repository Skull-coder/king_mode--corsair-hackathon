"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateEvent } from "@/lib/hooks/useCalendar";

type Tab = "draft" | "event";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

  // Determine default tab from route
  const defaultTab: Tab = pathname.startsWith("/calendar") ? "event" : "draft";
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Reset tab when opening
  useEffect(() => {
    if (isOpen) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  // ─── Draft form state ────────────────────────────────────────────────────
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Event form state ────────────────────────────────────────────────────
  const { mutate: createEvent, isPending: isCreatingEvent } = useCreateEvent();
  const [evSummary, setEvSummary] = useState("");
  const [evAllDay, setEvAllDay] = useState(false);
  const [evStartDate, setEvStartDate] = useState(toDateStr(new Date()));
  const [evStartTime, setEvStartTime] = useState(toTimeStr(new Date()));
  const [evEndDate, setEvEndDate] = useState(toDateStr(new Date()));
  const [evEndTime, setEvEndTime] = useState(
    toTimeStr(new Date(Date.now() + 3600000))
  );
  const [evLocation, setEvLocation] = useState("");
  const [evDescription, setEvDescription] = useState("");

  const resetDraft = () => { setTo(""); setSubject(""); setBody(""); };
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
    if (!to) { addToast("error", "Please specify a recipient"); return; }
    setIsSubmitting(true);
    try {
      const draftRes = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!draftRes.ok) throw new Error("Failed to prepare");
      const draft = await draftRes.json();
      const sendRes = await fetch(`/api/drafts/${draft.id}/send`, { method: "POST" });
      if (!sendRes.ok) throw new Error("Failed to send");
      addToast("success", "Email sent!");
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      resetDraft();
      onClose();
    } catch {
      addToast("error", "Failed to send");
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
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[#0e1116]/60 backdrop-blur-sm" onClick={onClose} />

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
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* ── Draft Form ──────────────────────────────────────────────────── */}
        {tab === "draft" && (
          <>
            <div className="p-5 space-y-4">
              <input
                type="text" value={to} onChange={(e) => setTo(e.target.value)}
                placeholder="To: recipient@email.com"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />
              <input
                type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />
              <textarea
                value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm resize-none"
              />
            </div>
            <div className="flex items-center justify-between p-5 border-t border-gray-800">
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-[#8b949e] hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleSendDraft}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}

        {/* ── Event Form ──────────────────────────────────────────────────── */}
        {tab === "event" && (
          <>
            <div className="p-5 space-y-4">
              <input
                type="text" value={evSummary} onChange={(e) => setEvSummary(e.target.value)}
                placeholder="Event title"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
              />

              <label className="flex items-center gap-2 text-sm text-[#8b949e] cursor-pointer">
                <input type="checkbox" checked={evAllDay} onChange={(e) => setEvAllDay(e.target.checked)} className="accent-[#5c4dff]" />
                All day
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">Start</label>
                  <input type="date" value={evStartDate} onChange={(e) => setEvStartDate(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]" />
                  {!evAllDay && (
                    <input type="time" value={evStartTime} onChange={(e) => setEvStartTime(e.target.value)}
                      className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]" />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">End</label>
                  <input type="date" value={evEndDate} onChange={(e) => setEvEndDate(e.target.value)}
                    className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]" />
                  {!evAllDay && (
                    <input type="time" value={evEndTime} onChange={(e) => setEvEndTime(e.target.value)}
                      className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]" />
                  )}
                </div>
              </div>

              <input type="text" value={evLocation} onChange={(e) => setEvLocation(e.target.value)}
                placeholder="Add location"
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm" />

              <textarea value={evDescription} onChange={(e) => setEvDescription(e.target.value)}
                placeholder="Add description" rows={3}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm resize-none" />
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
