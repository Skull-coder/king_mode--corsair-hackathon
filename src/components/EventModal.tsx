"use client";

import { useState, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { CalendarEvent } from "@/lib/hooks/useCalendar";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/lib/hooks/useCalendar";
import { useToast } from "@/lib/hooks/useToast";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
  defaultAllDay?: boolean;
  defaultSummary?: string;
}

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

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultStart,
  defaultEnd,
  defaultAllDay,
  defaultSummary,
}: EventModalProps) {
  const { addToast } = useToast();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const isPending = isCreating || isUpdating || isDeleting;
  const isEdit = !!event;

  // Form state
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [colorId, setColorId] = useState("1");
  const [visibility, setVisibility] = useState("default");
  const [transparency, setTransparency] = useState("opaque");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState("");

  // Refs for focus management
  const titleRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setSummary(event.summary || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
      setAllDay(!!event.start?.date);
      setStartDate(event.start?.date || event.start?.dateTime?.split("T")[0] || "");
      setStartTime(event.start?.dateTime?.split("T")[1]?.slice(0, 5) || "09:00");
      setEndDate(event.end?.date || event.end?.dateTime?.split("T")[0] || "");
      setEndTime(event.end?.dateTime?.split("T")[1]?.slice(0, 5) || "10:00");
      setColorId((event.colorId as string) || "1");
      setVisibility((event.visibility as string) || "default");
      setTransparency((event.transparency as string) || "opaque");
      setAttendees(
        (event.attendees || []).map((a) => ({
          email: a.email || "",
          displayName: a.displayName,
          responseStatus: a.responseStatus,
        }))
      );
    } else {
      setSummary(defaultSummary || "");
      setDescription("");
      setLocation("");
      setAllDay(defaultAllDay || false);
      const start = defaultStart || new Date();
      const end = defaultEnd || new Date(start.getTime() + 3600000);
      setStartDate(toDateStr(start));
      setStartTime(toTimeStr(start));
      setEndDate(toDateStr(end));
      setEndTime(toTimeStr(end));
      setColorId("1");
      setVisibility("default");
      setTransparency("opaque");
      setAttendees([]);
    }
    setNewAttendeeEmail("");
  }, [isOpen, event, defaultStart, defaultEnd, defaultAllDay, defaultSummary]);

  // Auto‑focus title when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => titleRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keep end date >= start date
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  // ─── Keyboard shortcuts ──────────────────────────────────────
  // Close on Escape
  useHotkeys("escape", onClose, { enabled: isOpen });

  // Save on Ctrl+Enter (works even in form fields)
  useHotkeys(
    "ctrl+enter",
    () => handleSave(),
    { enabled: isOpen, enableOnFormTags: true }
  );

  const buildPayload = (): CalendarEvent => {
    let finalEndDate = endDate;
    if (allDay) {
      // Google Calendar all-day end dates are exclusive, so add 1 day
      const d = new Date(endDate);
      d.setDate(d.getDate() + 1);
      finalEndDate = toDateStr(d);
    }

    const start = allDay
      ? { date: startDate }
      : { dateTime: `${startDate}T${startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    const end = allDay
      ? { date: finalEndDate }
      : { dateTime: `${endDate}T${endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };

    return {
      summary,
      description,
      location,
      start,
      end,
      colorId,
      visibility,
      transparency,
      attendees: attendees.map((a) => ({ email: a.email })),
    };
  };

  const handleSave = () => {
    if (!summary.trim()) {
      addToast("error", "Event title is required");
      return;
    }
    const payload = buildPayload();
    if (isEdit && event?.id) {
      updateEvent(
        { eventId: event.id, ...payload },
        {
          onSuccess: () => { addToast("success", "Event updated"); onClose(); },
          onError: () => addToast("error", "Failed to update event"),
        }
      );
    } else {
      createEvent(payload, {
        onSuccess: () => { addToast("success", "Event created"); onClose(); },
        onError: () => addToast("error", "Failed to create event"),
      });
    }
  };

  const handleDelete = () => {
    if (!event?.id) return;
    if (!confirm("Delete this event?")) return;
    deleteEvent(event.id, {
      onSuccess: () => { addToast("success", "Event deleted"); onClose(); },
      onError: () => addToast("error", "Failed to delete event"),
    });
  };

  const addAttendee = () => {
    const email = newAttendeeEmail.trim();
    if (!email) return;
    if (attendees.some((a) => a.email === email)) return;
    setAttendees([...attendees, { email, responseStatus: "needsAction" }]);
    setNewAttendeeEmail("");
  };

  const removeAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a.email !== email));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[#0e1116]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#151821] border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none transition-colors">&times;</button>
        </div>

        {/* Form — scrollable body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  locationRef.current?.focus();
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
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                  />
                )}
              </div>
              <div className="bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 space-y-2">
                <span className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">End</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                ref={locationRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    descriptionRef.current?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    titleRef.current?.focus();
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
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  locationRef.current?.focus();
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
                  onClick={() => setColorId(c.id)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    colorId === c.id
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
                value={transparency}
                onChange={(e) => setTransparency(e.target.value)}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 transition-colors appearance-none cursor-pointer"
              >
                <option value="opaque">Busy</option>
                <option value="transparent">Free</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
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
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
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
            {attendees.length > 0 && (
              <div className="space-y-1.5">
                {attendees.map((a) => (
                  <div
                    key={a.email}
                    className="flex items-center gap-2.5 py-2 px-3 bg-[#0e1116] rounded-lg border border-gray-800 text-sm group"
                  >
                    <span className="text-xs">{STATUS_DOT[a.responseStatus || "needsAction"]}</span>
                    <span className="text-white flex-1 truncate text-sm">
                      {a.displayName || a.email}
                    </span>
                    {!isEdit && (
                      <button
                        onClick={() => removeAttendee(a.email)}
                        className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center p-5 border-t border-gray-800 flex-shrink-0 ${isEdit ? "justify-between" : "justify-end"}`}>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function toDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}