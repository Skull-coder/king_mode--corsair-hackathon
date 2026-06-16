// hooks/useGlobalShortcuts.ts
"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";

export function useGlobalShortcuts() {
  const router = useRouter();

  useHotkeys("shift+i", () => router.push("/email/inbox"));
  useHotkeys("shift+s", () => router.push("/email/sent"));
  useHotkeys("shift+d", () => router.push("/email/drafts"));
  useHotkeys("shift+r", () => router.push("/email/reminders"));
  useHotkeys("shift+c", () => router.push("/calendar"));
  useHotkeys("shift+k", () => router.push("/king"));
}