"use client";

import { useEmails } from "@/lib/hooks/useEmails";
import { useSSE } from "@/lib/hooks/useSSE";
import { EmailRow } from "@/components/EmailRow";

export default function SentPage() {
  useSSE();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useEmails("SENT");

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold px-4 py-4 border-b">📤 Sent</h1>

      {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
      {error && <p className="p-4 text-red-500">Error: {String(error)}</p>}

      {allMessages.length === 0 && !isLoading && (
        <p className="p-4 text-gray-500">No sent messages.</p>
      )}

      <div>
        {allMessages.map((email) => (
          <EmailRow key={email.id} email={email} context="sent" href={`/sent/${email.id}`} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 text-sm"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-4">
        {allMessages.length} messages loaded
      </p>
    </div>
  );
}
