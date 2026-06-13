"use client";

import { useState } from "react";

const COLOR_LABELS: [string, string][] = [
  ["1", "Lavender"],
  ["2", "Sage"],
  ["3", "Grape"],
  ["4", "Flamingo"],
  ["5", "Banana"],
  ["6", "Tangerine"],
  ["7", "Peacock"],
  ["8", "Graphite"],
  ["9", "Blueberry"],
  ["10", "Basil"],
  ["11", "Tomato"],
];

interface CalendarSidebarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarSidebar({ onDateSelect, selectedDate }: CalendarSidebarProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  const isSelected = (d: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 p-4 border-l border-gray-800 space-y-6">
      {/* Mini Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="text-[#8b949e] hover:text-white text-sm px-1"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-white">
            {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={nextMonth}
            className="text-[#8b949e] hover:text-white text-sm px-1"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-[10px] text-[#8b949e] mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 text-center gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {days.map((d) => (
            <button
              key={d}
              onClick={() => onDateSelect(new Date(year, month, d))}
              className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors ${
                isSelected(d)
                  ? "bg-[#5c4dff] text-white font-semibold"
                  : isToday(d)
                    ? "text-[#5c4dff] font-semibold"
                    : "text-[#8b949e] hover:bg-gray-800 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
          Calendars
        </h3>
        <div className="space-y-1.5">
          {COLOR_LABELS.map(([id, label]) => (
            <div key={id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: getColor(id) }}
              />
              <span className="text-xs text-[#8b949e]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function getColor(id: string): string {
  const colors: Record<string, string> = {
    "1": "#7986cb", "2": "#33b679", "3": "#8e24aa", "4": "#e67c73",
    "5": "#f6c026", "6": "#f5511d", "7": "#039be5", "8": "#616161",
    "9": "#3f51b5", "10": "#0b8043", "11": "#d50000",
  };
  return colors[id] || "#7986cb";
}
