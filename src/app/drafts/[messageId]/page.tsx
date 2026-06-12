"use client";

import { use } from "react";
import { useEmail } from "@/lib/hooks/useEmails";
import Link from "next/link";

export default function DraftDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = use(params);
  const { data: email, isLoading, error } = useEmail(messageId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading draft...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-500">Failed to load draft: {String(error)}</p>
        <Link href="/drafts" className="text-blue-600 underline text-sm">
          ← Back to Drafts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/drafts" className="text-blue-600 underline text-sm mb-4 inline-block">
        ← Back to Drafts
      </Link>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
          📝 Draft
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mt-2">
        {email.subject || "(No Subject)"}
      </h1>

      <div className="mt-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
            D
          </div>
          <div>
            {email.to ? (
              <p className="font-semibold text-gray-900">To: {email.to}</p>
            ) : (
              <p className="font-semibold text-gray-400 italic">(No Recipients)</p>
            )}
            {email.cc && <p className="text-sm text-gray-400">cc: {email.cc}</p>}
            {email.bcc && <p className="text-sm text-gray-400">bcc: {email.bcc}</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 text-gray-800 leading-relaxed">
        {email.htmlBody ? (
          <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
        ) : email.snippet ? (
          <pre className="whitespace-pre-wrap font-sans">{email.snippet}</pre>
        ) : (
          <p className="text-gray-400 italic">Empty draft — nothing written yet.</p>
        )}
      </div>

      <div className="mt-8 pt-4 border-t text-xs text-gray-400 space-y-1">
        <p>Message ID: {email.id}</p>
        <p>Thread ID: {email.threadId}</p>
        {email.sizeEstimate > 0 && <p>Size: {(email.sizeEstimate / 1024).toFixed(1)} KB</p>}
      </div>
    </div>
  );
}
