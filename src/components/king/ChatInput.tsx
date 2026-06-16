"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="flex-shrink-0 border-t border-zinc-800 bg-[#0e1116] px-4 py-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Command your agent, Your Majesty..."
            className="w-full resize-none rounded-2xl border border-zinc-700 bg-[#151821] px-4 py-3 pr-12 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50"
          />
        </div>

        <button
          onClick={onSend}
          disabled={!canSend}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Send message"
        >
          {disabled ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-600">
        Press <kbd className="rounded border border-zinc-700 px-1 text-zinc-500">Enter</kbd> to send ·{" "}
        <kbd className="rounded border border-zinc-700 px-1 text-zinc-500">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
