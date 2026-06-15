// components/GlobalShortcutsProvider.tsx
"use client";
import { useGlobalShortcuts } from "@/lib/hooks/useGlobalShortcuts";

export function GlobalShortcutsProvider() {
  useGlobalShortcuts();
  return null; // no UI
}