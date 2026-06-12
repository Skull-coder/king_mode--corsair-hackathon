"use client";

import { use } from "react";
import { useEmail } from "@/lib/hooks/useEmails";
import Link from "next/link";

export default function EmailDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = use(params);
  const { data: email, isLoading, error } = useEmail(messageId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading email...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-500">Failed to load email: {String(error)}</p>
        <Link href="/inbox" className="text-blue-600 underline text-sm">
          ← Back to Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back link */}
      <Link href="/inbox" className="text-blue-600 underline text-sm mb-4 inline-block">
        ← Back to Inbox
      </Link>

      {/* Subject */}
      <h1 className="text-2xl font-bold text-gray-900 mt-2">
        {email.subject || "(No Subject)"}
      </h1>

      {/* Labels / Indicators */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {email.isUnread && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Unread</span>
        )}
        {email.isStarred && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⭐ Starred</span>
        )}
        {email.isImportant && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Important</span>
        )}
        {email.labelIds
          .filter((l) => !["UNREAD", "STARRED", "IMPORTANT", "INBOX", "SENT", "DRAFT"].includes(l))
          .map((label) => (
            <span key={label} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {label}
            </span>
          ))}
      </div>

      {/* Sender */}
      <div className="mt-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {(email.from || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{email.from || "Unknown Sender"}</p>
            {email.to && <p className="text-sm text-gray-500">to {email.to}</p>}
            {email.cc && <p className="text-sm text-gray-400">cc: {email.cc}</p>}
            {email.date && (
              <p className="text-xs text-gray-400 mt-0.5">{email.date}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 text-gray-800 leading-relaxed">
        {email.htmlBody ? (
          <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
        ) : email.textBody ? (
          <pre className="whitespace-pre-wrap font-sans">{email.textBody}</pre>
        ) : (
          <p className="text-gray-400 italic">No body content.</p>
        )}
      </div>

      {/* Meta footer */}
      <div className="mt-8 pt-4 border-t text-xs text-gray-400 space-y-1">
        <p>Message ID: {email.id}</p>
        <p>Thread ID: {email.threadId}</p>
        {email.sizeEstimate > 0 && <p>Size: {(email.sizeEstimate / 1024).toFixed(1)} KB</p>}
      </div>
    </div>
  );
}
