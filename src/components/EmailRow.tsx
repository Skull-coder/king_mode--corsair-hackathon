"use client";

import type { ParsedEmail } from "@/lib/email-parser";
import { formatEmailDate } from "@/lib/email-parser";
import Link from "next/link";

/**
 * A single email row — Gmail-style layout:
 * [Star] [Unread dot] From/To — Subject — Snippet — Date
 *
 * Pass `href` to make the row clickable (e.g. `/inbox/messageId`).
 */
export function EmailRow({
  email,
  context,
  href,
}: {
  email: ParsedEmail;
  context: "inbox" | "sent" | "draft";
  href?: string;
}) {
  const isDraft = email.isDraft;

  const displayPerson =
    context === "inbox"
      ? email.from || "Unknown Sender"
      : email.to || "(No Recipients)";

  const displayDate =
    context === "draft"
      ? `Draft · ${formatEmailDate(email.internalDate)}`
      : formatEmailDate(email.internalDate);

  const content = (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
        email.isUnread ? "bg-blue-50/30" : "bg-white"
      }`}
    >
      {/* Star indicator */}
      <span className="text-sm w-5 text-center flex-shrink-0">
        {email.isStarred ? "⭐" : email.isImportant ? "🏷" : ""}
      </span>

      {/* Unread dot */}
      <span className="w-2 flex-shrink-0">
        {email.isUnread && (
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
        )}
      </span>

      {/* Person name/email */}
      <span
        className={`w-48 flex-shrink-0 truncate text-sm ${
          email.isUnread ? "font-semibold text-gray-900" : "text-gray-700"
        }`}
        title={displayPerson}
      >
        {displayPerson}
      </span>

      {/* Subject + Snippet */}
      <span className="flex-1 min-w-0 flex gap-1 items-baseline">
        <span
          className={`truncate text-sm ${
            email.isUnread ? "font-semibold text-gray-900" : "text-gray-700"
          }`}
        >
          {email.subject || "(No Subject)"}
        </span>
        <span className="text-sm text-gray-400 truncate hidden sm:inline">
          {" — "}
          {email.snippet || (isDraft ? "Empty draft..." : "")}
        </span>
      </span>

      {/* Date */}
      <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
        {displayDate}
      </span>

      {/* Draft indicator */}
      {isDraft && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex-shrink-0">
          Draft
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
