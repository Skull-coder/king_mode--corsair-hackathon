"use client";

import { CalendarContainer } from "@/components/CalendarContainer";
import { useSSE } from "@/lib/hooks/useSSE";

export default function CalendarPage() {
  useSSE();
  return <CalendarContainer />;
}
