"use client";

import type { EventApi } from "@fullcalendar/core";

export function EventContent({ event }: { event: EventApi }) {
  const props = event.extendedProps as Record<string, unknown>;
  const hasTime = !event.allDay;
  const hasRecurrence =
    Array.isArray(props.recurrence) && (props.recurrence as unknown[]).length > 0;
  const attendees = props.attendees as Array<{ responseStatus?: string }> | undefined;
  const acceptedCount = attendees?.filter((a) => a.responseStatus === "accepted").length ?? 0;
  const totalAttendees = attendees?.length ?? 0;

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 overflow-hidden text-xs">
      {hasTime && (
        <span className="font-semibold text-white/90 flex-shrink-0">
          {event.start?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      {hasRecurrence && <span className="text-white/70 flex-shrink-0">🔄</span>}
      <span className="truncate font-medium">{event.title}</span>
      {totalAttendees > 0 && (
        <span className="text-white/50 flex-shrink-0 ml-auto text-[10px]">
          {acceptedCount}/{totalAttendees}
        </span>
      )}
    </div>
  );
}
