"use client";

import type { ParsedEmail } from "@/lib/email";
import { formatEmailDate } from "@/lib/email";
import Link from "next/link";

// Helper to match the specific avatar colors from your UI
function getAvatarStyle(name: string) {
  const char = name.charAt(0).toUpperCase();
  if (["A", "B", "C"].includes(char))
    return "bg-[#1a3d2e] text-[#4ade80] border-[#22523e]"; // Green
  if (["S", "U", "V"].includes(char))
    return "bg-[#1e3a5f] text-[#60a5fa] border-[#284d7d]"; // Blue
  if (["R", "P", "Q"].includes(char))
    return "bg-[#3b2a59] text-[#c084fc] border-[#4b3570]"; // Purple
  if (["T", "W", "Y"].includes(char))
    return "bg-[#4a3f1d] text-[#facc15] border-[#5c4f24]"; // Yellow
  return "bg-gray-800 text-gray-300 border-gray-700"; // Fallback
}

export function EmailList({
  emails,
  isLoading,
  error,
  context,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEmailClick,
}: {
  emails: ParsedEmail[];
  isLoading: boolean;
  error: Error | null;
  context: "inbox" | "sent" | "draft" | "archive" | "trash";
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** For drafts: instead of navigating, pass the email to ComposeModal */
  onEmailClick?: (email: ParsedEmail) => void;
}) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 bg-[#151821] rounded-xl border border-gray-800">
        Failed to load emails: {error.message}
      </div>
    );
  }

  if (!isLoading && emails.length === 0) {
    const emptyMessages: Record<string, string> = {
      inbox: "No messages in inbox.",
      sent: "No sent messages.",
      draft: "No drafts.",
      archive: "No archived messages.",
      trash: "Trash is empty.",
    };
    return (
      <div className="flex items-center justify-center h-64 text-[#8b949e] bg-[#151821] rounded-xl border border-gray-800">
        {emptyMessages[context]}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {emails.map((email) => {
        const isDraft = email.isDraft;
        const displayPerson =
          context === "inbox" || context === "archive" || context === "trash"
            ? email.from || "Unknown Sender"
            : email.to || "(No Recipients)";
        const displayDate =
          context === "draft"
            ? `Draft · ${formatEmailDate(email.internalDate)}`
            : formatEmailDate(email.internalDate);
        const detailPath =
          context === "inbox"
            ? `/email/inbox/${email.threadId}`
            : context === "sent"
              ? `/email/sent/${email.threadId}`
              : context === "archive"
                ? `/email/archives/${email.threadId}`
                : context === "trash"
                  ? `/email/trash/${email.threadId}`
                  : ""; // drafts use onEmailClick instead

        const rowContent = (
          <div className="flex gap-4 p-5 bg-[#151821] border border-gray-800/80 rounded-2xl hover:border-gray-700 hover:bg-[#1a1d27] cursor-pointer transition-all group">
          
            {/* Avatar */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold flex-shrink-0 border ${getAvatarStyle(displayPerson)}`}
            >
              {displayPerson.charAt(0).toUpperCase()}
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-4">
              {/* Top Row: Sender & Date */}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-200 text-sm truncate">
                  {displayPerson}
                </span>
                <span className="text-xs text-[#8b949e] flex-shrink-0 ml-4">
                  {displayDate}
                </span>
              </div>

              {/* Middle Row: Subject */}
              <div className="font-medium text-gray-200 text-sm truncate pr-8">
                {email.subject || "(No Subject)"}
              </div>

              {/* Bottom Row: Snippet & Icons */}
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-sm text-[#8b949e] truncate pr-4">
                  {email.snippet || (isDraft ? "Empty draft..." : "")}
                  {isDraft && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded font-medium">
                      Draft
                    </span>
                  )}
                </span>

                {/* Right Aligned Indicators */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {email.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#5c4dff]"></span>
                  )}
                  <svg
                    className={`w-4 h-4 transition-colors ${email.isStarred ? "text-[#facc15] fill-current" : "text-[#8b949e] group-hover:text-gray-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );

        // Drafts: use onClick callback; Inbox/Sent: use Link navigation
        if (context === "draft" && onEmailClick) {
          return (
            <div key={email.id} onClick={() => onEmailClick(email)}>
              {rowContent}
            </div>
          );
        }

        return (
          <Link key={email.id} href={detailPath}>
            {rowContent}
          </Link>
        );
      })}

      {/* Load More Button matching dark theme */}
      {hasNextPage && (
        <div className="flex justify-center pt-6 pb-4">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 bg-[#5c4dff] text-white rounded-lg disabled:opacity-50 text-sm font-medium hover:bg-[#4b3be0] transition-colors shadow-lg shadow-[#5c4dff]/20"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-[#8b949e] text-center pt-2">
        {emails.length}{" "}
        {context === "draft" ? "drafts" : context === "archive" ? "archived messages" : context === "trash" ? "trashed messages" : "messages"} loaded
      </p>
    </div>
  );
}
