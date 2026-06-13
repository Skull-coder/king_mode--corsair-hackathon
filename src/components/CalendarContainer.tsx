"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Calendar } from "./Calendar";
import { CalendarSidebar } from "./CalendarSidebar";
import { EventModal } from "./EventModal";
import type { CalendarEvent } from "@/lib/hooks/useCalendar";
import type { CalendarApi } from "@fullcalendar/core";
import { useCalendarEvents, useUpdateEvent } from "@/lib/hooks/useCalendar";
import { useToast } from "@/lib/hooks/useToast";

export function CalendarContainer() {
  const { addToast } = useToast();
  const { mutate: updateEvent } = useUpdateEvent();
  const calendarApiRef = useRef<CalendarApi | null>(null);

  // Time range for fetching
  const [timeMin, setTimeMin] = useState<string>();
  const [timeMax, setTimeMax] = useState<string>();

  const { data, isLoading } = useCalendarEvents(timeMin, timeMax);
  const allEvents = data?.pages.flatMap((p) => p.items ?? []) ?? [];

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [slotStart, setSlotStart] = useState<Date>();
  const [slotEnd, setSlotEnd] = useState<Date>();
  const [slotAllDay, setSlotAllDay] = useState(false);

  // Sidebar date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // When user clicks a date in the mini calendar, navigate the main calendar
  useEffect(() => {
    calendarApiRef.current?.gotoDate(selectedDate);
  }, [selectedDate]);

  const handleDatesSet = useCallback((start: Date, end: Date) => {
    setTimeMin(start.toISOString());
    setTimeMax(end.toISOString());
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback((start: Date, end: Date, allDay: boolean) => {
    setEditingEvent(null);
    setSlotStart(start);
    setSlotEnd(end);
    setSlotAllDay(allDay);
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    (eventId: string, start: string, end: string, allDay: boolean) => {
      const payload: Record<string, unknown> = allDay
        ? { start: { date: start.split("T")[0] }, end: { date: end.split("T")[0] } }
        : { start: { dateTime: start }, end: { dateTime: end } };

      updateEvent(
        { eventId, ...payload } as any,
        {
          onSuccess: () => addToast("success", "Event moved"),
          onError: () => addToast("error", "Failed to move event"),
        }
      );
    },
    [updateEvent, addToast]
  );

  const handleEventResize = useCallback(
    (eventId: string, end: string) => {
      updateEvent(
        { eventId, end: { dateTime: end } } as any,
        {
          onSuccess: () => addToast("success", "Event resized"),
          onError: () => addToast("error", "Failed to resize event"),
        }
      );
    },
    [updateEvent, addToast]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingEvent(null);
  }, []);

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-[#0e1116]">
      {/* Calendar */}
      <div className="flex-1 p-4 overflow-hidden">
    
          <Calendar
            events={allEvents}
            onDatesSet={handleDatesSet}
            onEventClick={handleEventClick}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onDateClick={(date) => setSelectedDate(date)}
            calendarApiRef={calendarApiRef}
          />
        
      </div>

      {/* Sidebar */}
      <CalendarSidebar
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      {/* Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={closeModal}
        event={editingEvent}
        defaultStart={slotStart}
        defaultEnd={slotEnd}
        defaultAllDay={slotAllDay}
      />
    </div>
  );
}
