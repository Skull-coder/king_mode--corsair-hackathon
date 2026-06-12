"use client";

import { use } from "react";
import { useEmails } from "@/lib/hooks/useEmails";
import { useSSE } from "@/lib/hooks/useSSE";
import { EmailList } from "@/components/EmailList";
import { ComposeOverlay } from "@/components/ComposeOverlay";
import { EmailListSkeleton } from "@/components/LoadingSkeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DraftEditPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = use(params);
  const router = useRouter();
  useSSE();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useEmails("DRAFT");

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  // Find the draft in the cached list to get its draftId
  const draft = allMessages.find((m) => m.id === messageId);
  const draftId = draft?.draftId || null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1116] text-white relative">
      {/* Background list (dimmed when overlay is active) */}
      <div className={`p-8 pb-4 max-w-5xl transition-opacity duration-300 ${messageId ? "opacity-30 pointer-events-none select-none blur-sm" : ""}`}>
        <h1 className="text-2xl font-bold mb-6">Drafts</h1>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-b border-gray-800 pb-3 mb-6">
          <Link href="/email/inbox" className="flex items-center space-x-2 text-[#8b949e] font-medium px-4 py-2 rounded-lg">
            <span>Inbox</span>
          </Link>
          <Link href="/email/sent" className="flex items-center space-x-2 text-[#8b949e] font-medium px-4 py-2 rounded-lg">
            <span>Sent</span>
          </Link>
          <Link href="/email/drafts" className="flex items-center space-x-2 text-[#5c4dff] font-medium px-4 py-2 bg-[#5c4dff]/10 rounded-lg">
            <span>Drafts</span>
          </Link>
        </div>

        {isLoading ? (
          <EmailListSkeleton />
        ) : (
          <EmailList
            emails={allMessages}
            isLoading={isLoading}
            error={error as Error | null}
            context="draft"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        )}
      </div>

      {/* Compose Overlay for editing */}
      {messageId && (
        <ComposeOverlay
          draftId={draftId}
          messageId={messageId}
          onClose={() => router.push("/email/drafts")}
        />
      )}
    </div>
  );
}
