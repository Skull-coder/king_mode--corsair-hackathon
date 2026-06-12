"use client";

import { useToast } from "@/lib/hooks/useToast";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    // Shifted slightly left (right-24) so it doesn't overlap with the bottom-right FAB
    <div className="fixed bottom-6 right-24 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium min-w-[280px] border transform transition-all animate-slide-up cursor-pointer ${
            toast.type === "success"
              ? "bg-[#151821] border-green-500/30 text-green-400"
              : toast.type === "error"
                ? "bg-[#151821] border-red-500/30 text-red-400"
                : "bg-[#151821] border-gray-700 text-gray-200"
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="flex-shrink-0 text-lg">
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button className="text-gray-500 hover:text-white transition-colors text-xl leading-none mb-0.5">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}