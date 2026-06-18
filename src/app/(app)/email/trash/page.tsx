"use client";

import { useTrashEmails } from "@/lib/hooks/useEmails";
import { useSSE } from "@/lib/hooks/useSSE";
import { EmailList } from "@/components/EmailList";
import { EmailListSkeleton } from "@/components/LoadingSkeleton";
import Link from "next/link";

export default function TrashPage() {
  useSSE();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useTrashEmails();

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1116] text-white overflow-y-auto">
      <div className="p-8 pb-4 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          {/* Trash icon */}
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Trash</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b border-gray-800 pb-3 mb-6 overflow-x-auto">
          <Link
            href="/email/inbox"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span>Inbox</span>
          </Link>
          <Link
            href="/email/sent"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Sent</span>
          </Link>
          <Link
            href="/email/drafts"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Drafts</span>
          </Link>
          <Link
            href="/email/reminders"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Reminders</span>
          </Link>
          <Link
            href="/email/archives"
            className="flex items-center space-x-2 text-[#8b949e] hover:text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
            </svg>
            <span>Archives</span>
          </Link>
          <Link
            href="/email/trash"
            className="flex items-center space-x-2 text-red-400 font-medium px-4 py-2 bg-red-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Trash</span>
          </Link>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-[#151821] border border-red-900/30 rounded-xl text-sm text-[#8b949e]">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            Messages in Trash will be automatically deleted after 30 days. Open any message to{" "}
            <span className="text-white font-medium">restore it to inbox</span>.
          </p>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <EmailListSkeleton />
        ) : (
          <EmailList
            emails={allMessages}
            isLoading={isLoading}
            error={error as Error | null}
            context="trash"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        )}
      </div>
    </div>
  );
}
