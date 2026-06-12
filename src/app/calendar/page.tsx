"use client";

import { useCalendarEvents } from "@/lib/hooks/useCalendar";
import { useSSE } from "@/lib/hooks/useSSE";

function formatEventDate(start: any): string {
  if (!start) return "";
  const d = start.dateTime
    ? new Date(start.dateTime)
    : start.date
      ? new Date(start.date)
      : null;
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  useSSE();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useCalendarEvents();

  const allEvents = data?.pages.flatMap((p) => p.items ?? []) ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold px-4 py-4 border-b">📅 Calendar</h1>

      {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
      {error && <p className="p-4 text-red-500">Error: {String(error)}</p>}

      {allEvents.length === 0 && !isLoading && (
        <p className="p-4 text-gray-500">No upcoming events.</p>
      )}

      <div>
        {allEvents.map((event, i) => (
          <div
            key={event.id ?? i}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
          >
            {/* Time */}
            <span className="w-36 flex-shrink-0 text-sm text-gray-600">
              {formatEventDate(event.start)}
              {event.start?.dateTime && event.end?.dateTime && (
                <>
                  {" — "}
                  {new Date(event.end.dateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </span>

            {/* Title + Location */}
            <span className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate block">
                {event.summary || "(No Title)"}
              </span>
              {event.location && (
                <span className="text-xs text-gray-400 truncate block">
                  📍 {event.location}
                </span>
              )}
            </span>

            {/* Status */}
            {event.status === "cancelled" && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0">
                Cancelled
              </span>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 text-sm"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-4">
        {allEvents.length} events loaded
      </p>
    </div>
  );
}
