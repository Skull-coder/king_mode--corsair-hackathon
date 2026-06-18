"use client";

import { use } from "react";
import { useSSE } from "@/lib/hooks/useSSE";
import { EmailDetailOverlay } from "@/components/EmailDetailOverlay";
import { useRouter } from "next/navigation";

export default function ArchiveThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const router = useRouter();
  useSSE();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1116] text-white relative">
      {threadId && (
        <EmailDetailOverlay
          threadId={threadId}
          context="archive"
          onClose={() => router.push("/email/archives")}
        />
      )}
    </div>
  );
}
