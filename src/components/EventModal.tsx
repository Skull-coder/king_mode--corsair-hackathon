"use client";

import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/lib/hooks/useCalendar";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/lib/hooks/useCalendar";
import { useToast } from "@/lib/hooks/useToast";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Existing event for edit mode, null for create */
  event: CalendarEvent | null;
  /** Prefilled date range from slot selection */
  defaultStart?: Date;
  defaultEnd?: Date;
  defaultAllDay?: boolean;
  /** Prefilled summary (e.g. from email subject) */
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
  }, [isOpen]);

  const buildPayload = (): CalendarEvent => {
    const start = allDay
      ? { date: startDate }
      : { dateTime: `${startDate}T${startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    const end = allDay
      ? { date: endDate }
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

      <div className="relative w-full max-w-lg bg-[#151821] border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add title"
              className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
            />
          </div>

          {/* All day toggle + dates */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#8b949e] cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="accent-[#5c4dff]"
              />
              All day
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-[#5c4dff]"
                />
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
              className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] text-sm resize-none"
            />
          </div>

          {/* Color + Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1">Color</label>
              <select
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
              >
                {["1","2","3","4","5","6","7","8","9","10","11"].map((id) => (
                  <option key={id} value={id}>Color {id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1">Show as</label>
              <select
                value={transparency}
                onChange={(e) => setTransparency(e.target.value)}
                className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
              >
                <option value="opaque">Busy</option>
                <option value="transparent">Free</option>
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs text-[#8b949e] mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5c4dff]"
            >
              <option value="default">Default</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="confidential">Confidential</option>
            </select>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs text-[#8b949e] mb-2">Attendees</label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                placeholder="Add email"
                className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#5c4dff]"
              />
              <button
                onClick={addAttendee}
                className="px-4 py-2 bg-[#5c4dff] text-white text-sm rounded-lg hover:bg-[#4b3be0] transition-colors"
              >
                Add
              </button>
            </div>
            {attendees.length > 0 && (
              <div className="space-y-1.5">
                {attendees.map((a) => (
                  <div
                    key={a.email}
                    className="flex items-center gap-2 py-1.5 px-3 bg-[#0e1116] rounded-lg border border-gray-800 text-sm"
                  >
                    <span>{STATUS_DOT[a.responseStatus || "needsAction"]}</span>
                    <span className="text-white flex-1 truncate">
                      {a.displayName || a.email}
                    </span>
                    {!isEdit && (
                      <button
                        onClick={() => removeAttendee(a.email)}
                        className="text-gray-500 hover:text-red-400 text-xs"
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
        <div className="flex items-center justify-between p-5 border-t border-gray-800">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8b949e] hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors disabled:opacity-50 shadow-lg shadow-[#5c4dff]/20"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
