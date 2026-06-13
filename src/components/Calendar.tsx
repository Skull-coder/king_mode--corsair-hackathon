"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import type { EventInput, DatesSetArg, EventClickArg, DateSelectArg, EventDropArg, EventChangeArg, CalendarApi } from "@fullcalendar/core";
import { useCallback, useRef, useEffect } from "react";
import type { CalendarEvent } from "@/lib/hooks/useCalendar";
import { EventContent } from "./EventContent";

interface CalendarProps {
  events: CalendarEvent[];
  onDatesSet: (start: Date, end: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSelectSlot: (start: Date, end: Date, allDay: boolean) => void;
  onEventDrop: (eventId: string, start: string, end: string, allDay: boolean) => void;
  onEventResize: (eventId: string, end: string) => void;
  onDateClick?: (date: Date) => void;
  calendarApiRef?: React.MutableRefObject<CalendarApi | null>;
}

const COLOR_MAP: Record<string, string> = {
  "1": "#7986cb", // lavender
  "2": "#33b679", // sage
  "3": "#8e24aa", // grape
  "4": "#e67c73", // flamingo
  "5": "#f6c026", // banana
  "6": "#f5511d", // tangerine
  "7": "#039be5", // peacock
  "8": "#616161", // graphite
  "9": "#3f51b5", // blueberry
  "10": "#0b8043", // basil
  "11": "#d50000", // tomato
};

const calendarTheme = `
  .fc { --fc-border-color: #1e2230; --fc-page-bg-color: #0e1116; --fc-neutral-bg-color: #151821; }
  .fc .fc-toolbar-title { color: #fff; font-size: 1.25rem; font-weight: 600; }
  .fc .fc-button { background: #151821; border: 1px solid #2a2d3a; color: #8b949e; border-radius: 8px; padding: 6px 14px; font-size: 0.8125rem; font-weight: 500; text-transform: none; }
  .fc .fc-button:hover { background: #1e2230; color: #fff; }
  .fc .fc-button-primary:not(:disabled).fc-button-active { background: #5c4dff !important; border-color: #5c4dff !important; color: #fff !important; }
  .fc .fc-button-primary:not(:disabled):active { background: #4b3be0 !important; }
  .fc .fc-col-header-cell { background: #0e1116; color: #8b949e; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 0; border-bottom: 1px solid #1e2230; }
  .fc .fc-daygrid-day { background: #0e1116; border-color: #1e2230; }
  .fc .fc-daygrid-day.fc-day-today { background: #5c4dff08; }
  .fc .fc-daygrid-day-number { color: #8b949e; font-size: 0.75rem; padding: 6px 8px; }
  .fc .fc-day-today .fc-daygrid-day-number { color: #5c4dff; font-weight: 700; }
  .fc .fc-timegrid-slot { border-color: #1e2230; height: 3rem; }
  .fc .fc-timegrid-slot-label { color: #8b949e; font-size: 0.6875rem; }
  .fc .fc-timegrid-axis { border-color: #1e2230; }
  .fc .fc-timegrid-now-indicator-line { border-color: #ef4444; }
  .fc .fc-timegrid-now-indicator-arrow { border-color: #ef4444; }
  .fc .fc-list-day-cushion { background: #151821; }
  .fc .fc-list-day-text, .fc .fc-list-day-side-text { color: #fff; }
  .fc .fc-list-event { background: #0e1116; border-color: #1e2230; }
  .fc .fc-list-event:hover { background: #151821; }
  .fc .fc-list-event-time { color: #8b949e; }
  .fc .fc-list-event-title { color: #e0e0e0; }
  .fc .fc-scrollgrid { border-color: #1e2230 !important; }
  .fc .fc-multimonth { border-color: #1e2230; background: #0e1116; }
  .fc .fc-multimonth-daygrid { background: #0e1116; }
  .fc .fc-multimonth-header { background: #151821; color: #8b949e; }
  .fc .fc-multimonth-title { color: #fff; font-weight: 600; }
`;

export function Calendar({
  events,
  onDatesSet,
  onEventClick,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  onDateClick,
  calendarApiRef,
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Expose the FullCalendar API to the parent so sidebar can control navigation
  useEffect(() => {
    if (calendarApiRef && calendarRef.current) {
      calendarApiRef.current = calendarRef.current.getApi();
    }
  }, [calendarApiRef]);

  const fullEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.summary || "(No Title)",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    allDay: !!e.start?.date,
    color: COLOR_MAP[e.colorId as string] || COLOR_MAP["1"],
    extendedProps: e,
  }));

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      onDatesSet(arg.start, arg.end);
    },
    [onDatesSet]
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      onEventClick(arg.event.extendedProps as CalendarEvent);
    },
    [onEventClick]
  );

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      onSelectSlot(arg.start, arg.end, arg.allDay);
    },
    [onSelectSlot]
  );

  const handleEventDrop = useCallback(
    (arg: EventDropArg) => {
      const start = arg.event.startStr;
      const end = arg.event.endStr || "";
      onEventDrop(arg.event.id, start, end, arg.event.allDay);
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    (arg: EventChangeArg) => {
      if (arg.event.endStr) {
        onEventResize(arg.event.id, arg.event.endStr);
      }
    },
    [onEventResize]
  );

  return (
    <>
      <style>{calendarTheme}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        views={{
          multiMonthYear: { type: "multiMonth", duration: { months: 12 } },
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
          list: "Agenda",
          multiMonthYear: "Year",
        }}
        events={fullEvents}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        selectable={true}
        select={handleSelect}
        selectMirror={true}
        editable={true}
        eventDrop={handleEventDrop}
        eventChange={handleEventResize}
        eventContent={(arg) => <EventContent event={arg.event} />}
        nowIndicator={true}
        height="100%"
        dayMaxEvents={4}
        weekends={true}
      />
    </>
  );
}
