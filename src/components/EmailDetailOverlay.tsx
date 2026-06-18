"use client";
import { formatEmailDate } from "@/lib/email";
import {
  useEmail,
  useToggleStar,
  useModifyEmail,
  useDeleteEmail,
  useTrashEmail,
  useThread,
  useSendEmail,
} from "@/lib/hooks/useEmails";
import { useToast } from "@/lib/hooks/useToast";
import { EmailDetailSkeleton } from "@/components/LoadingSkeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ParsedEmail } from "@/lib/email";
import { useEffect, useRef, useState } from "react";
import { EventModal } from "@/components/EventModal";

function EmailHtmlFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeObserver: ResizeObserver | null = null;

    const resize = () => {
      try {
        const doc = iframe.contentWindow?.document;
        if (!doc?.body) return;
        const h = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
        );
        if (h > 0) setHeight(h);
      } catch (e) {
        console.error("resize failed:", e);
      }
    };

    const handleLoad = () => {
      resize();
      setTimeout(resize, 100);
      setTimeout(resize, 500);

      try {
        const doc = iframe.contentWindow?.document;
        if (doc) {
          // remeasure on late-loading images
          doc.querySelectorAll("img").forEach((img) => {
            if (!img.complete) img.addEventListener("load", resize);
          });

          // remeasure on any DOM size changes (handles dynamic content, fonts)
          if (doc.body && "ResizeObserver" in window) {
            resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(doc.body);
          }
        }
      } catch (e) {
        console.error("setup failed:", e);
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
      resizeObserver?.disconnect();
    };
  }, [html]);

  const srcDoc = `
    <html>
      <head>
        <base target="_blank" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: transparent;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            word-wrap: break-word;
            box-sizing: border-box;
          }
          body, body * {
            color: #e5e7eb !important;
            background-color: transparent !important;
          }
          a, a * { color: #5c4dff !important; }
          a:hover { color: #7b6dff !important; }
          img { max-width: 100%; height: auto; }
          table { max-width: 100%; }
          /* email tables sometimes set fixed widths — let them shrink */
          table, td, th { min-width: 100% !important; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{
        width: "100%",
        height: height > 0 ? `${height}px` : "200px",
        border: "none",
        display: "block",
        overflow: "hidden",
      }}
      title="Email content"
    />
  );
}

// Helper to match the specific avatar colors from your UI
function getAvatarStyle(name: string) {
  const char = name.charAt(0).toUpperCase();
  if (["A", "B", "C"].includes(char))
    return "bg-[#1a3d2e] text-[#4ade80] border-[#22523e]";
  if (["S", "U", "V"].includes(char))
    return "bg-[#3b2a59] text-[#c084fc] border-[#4b3570]"; // Purple for 'S'
  if (["R", "P", "Q"].includes(char))
    return "bg-[#1e3a5f] text-[#60a5fa] border-[#284d7d]";
  if (["T", "W", "Y"].includes(char))
    return "bg-[#4a3f1d] text-[#facc15] border-[#5c4f24]";
  return "bg-gray-800 text-gray-300 border-gray-700";
}

// ─── Context Action Bar (shown at top of archive/trash thread view) ──────────

function ContextActionBar({
  threadId,
  context,
  onDone,
}: {
  threadId: string;
  context: "archive" | "trash";
  onDone: () => void;
}) {
  const { mutate: modifyEmail, isPending: isModifying } = useModifyEmail();
  const { mutate: trashEmail, isPending: isTrashing } = useTrashEmail();
  const { addToast } = useToast();

  const isLoading = isModifying || isTrashing;

  if (context === "trash") {
    return (
      <div className="flex items-center gap-2">
        {/* Restore from Trash */}
        <button
          onClick={() =>
            modifyEmail(
              { messageId: threadId, untrash: true },
              {
                onSuccess: () => {
                  addToast("success", "Restored to Inbox");
                  onDone();
                },
                onError: () => addToast("error", "Failed to restore"),
              },
            )
          }
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#5c4dff] hover:bg-[#4b3be0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-[#5c4dff]/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          {isModifying ? "Restoring..." : "Restore to Inbox"}
        </button>
      </div>
    );
  }

  // context === "archive"
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          modifyEmail(
            { messageId: threadId, unarchive: true },
            {
              onSuccess: () => {
                addToast("success", "Moved to Inbox");
                onDone();
              },
              onError: () => addToast("error", "Failed to unarchive"),
            },
          )
        }
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[#5c4dff] hover:bg-[#4b3be0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-[#5c4dff]/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {isModifying ? "Moving..." : "Move to Inbox"}
      </button>
      <button
        onClick={() =>
          trashEmail(threadId, {
            onSuccess: () => {
              addToast("success", "Moved to Trash");
              onDone();
            },
            onError: () => addToast("error", "Failed to trash"),
          })
        }
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-red-900/20 border border-red-800/50 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 text-sm font-semibold rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {isTrashing ? "Moving..." : "Move to Trash"}
      </button>
    </div>
  );
}

interface EmailDetailOverlayProps {
  threadId: string;
  context: "inbox" | "sent" | "archive" | "trash";
  onClose: () => void;
}

export function EmailDetailOverlay({
  threadId,
  context,
  onClose,
}: EmailDetailOverlayProps) {
  const router = useRouter();
  const { data: thread, isLoading, error } = useThread(threadId);
  const { mutate: sendEmail, isPending: isSending } = useSendEmail();
  const { addToast } = useToast();

  const [replyTo, setReplyTo] = useState<ParsedEmail | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when reply panel opens
  useEffect(() => {
    if (replyTo && scrollContainerRef.current) {
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [replyTo]);

  const handleClose = () => {
    onClose();
    if (context === "archive") router.push("/email/archives");
    else if (context === "trash") router.push("/email/trash");
    else router.push(`/email/${context}`);
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-40 bg-[#0e1116] overflow-y-auto">
        <EmailDetailSkeleton />
      </div>
    );
  }

  if (error || !thread || thread.messages.length === 0) {
    return (
      <div className="absolute inset-0 z-40 bg-[#0e1116] flex items-center justify-center">
        <div className="bg-[#151821] border border-gray-800 p-8 rounded-2xl text-center">
          <p className="text-red-400 mb-4">Failed to load thread.</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-[#5c4dff] text-white rounded-lg hover:bg-[#4b3be0] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const subject = thread.messages[0]?.subject || "(No Subject)";
  const lastMessage = thread.messages[thread.messages.length - 1];

  const openReply = (msg: ParsedEmail) => {
    setReplyTo(msg);
    setReplyBody("");
  };

  const closeReply = () => {
    setReplyTo(null);
    setReplyBody("");
  };

  const handleSend = (): Promise<{ threadId: string; messageId: string }> => {
    return new Promise((resolve, reject) => {
      if (!replyTo || !replyBody.trim()) {
        return reject(new Error("No reply"));
      }

      const emailMatch = replyTo.from?.match(/<([^>]+)>/);
      const toAddress = emailMatch ? emailMatch[1] : replyTo.from;

      const existingRefs = replyTo.references ? `${replyTo.references} ` : "";
      const references =
        `${existingRefs}${replyTo.messageIdHeader || ""}`.trim();

      sendEmail(
        {
          to: [toAddress],
          subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
          body: replyBody,
          threadId,
          inReplyToMessageId: replyTo.messageIdHeader,
          references,
        },
        {
          onSuccess: (result) => {
            addToast("success", "Reply sent");
            closeReply();
            // Extract the threadId and messageId from the send result
            resolve({
              threadId: result.threadId ?? threadId,
              messageId: result.id ?? "",
            });
          },
          onError: (error) => {
            addToast("error", "Failed to send reply");
            reject(error);
          },
        },
      );
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      className="absolute inset-0 z-40 bg-[#0e1116] overflow-y-auto p-8 animate-fade-in flex flex-col items-center"
    >
      <div className="w-full max-w-4xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-6 font-medium">
          <Link
            href={
              context === "archive"
                ? "/email/archives"
                : context === "trash"
                  ? "/email/trash"
                  : `/email/${context}`
            }
            className="text-[#5c4dff] hover:text-[#7b6dff] transition-colors capitalize"
          >
            {context === "archive" ? "Archives" : context === "trash" ? "Trash" : context}
          </Link>
          <span className="text-[#8b949e]">
            <svg
              className="w-3 h-3 inline-block mx-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            Message
          </span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-100">{subject}</h1>
          {(context === "archive" || context === "trash") && (
            <div className="flex items-center gap-2">
              <ContextActionBar threadId={threadId} context={context} onDone={handleClose} />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-4">
          {thread.messages.map((email, index) => (
            <MessageCard
              key={email.id}
              email={email}
              context={context}
              isLast={index === thread.messages.length - 1}
              onDeleted={handleClose}
              onReply={() => openReply(email)}
            />
          ))}
        </div>

        {/* Reply panel */}
        {replyTo && (
          <ReplyPanel
            replyTo={replyTo}
            body={replyBody}
            onChangeBody={setReplyBody}
            onSend={handleSend}
            onDiscard={closeReply}
            isSending={isSending}
            threadId={threadId}
            subject={subject}
          />
        )}
      </div>
    </div>
  );
}

// ─── Reply Panel ────────────────────────────────────────────────────────────

import { useCreateReminder } from "@/lib/hooks/use-reminders";
import { useHotkeys } from "react-hotkeys-hook";

interface ReplyPanelProps {
  replyTo: { from: string };
  body: string;
  onChangeBody: (value: string) => void;
  onSend: () => Promise<{ threadId: string; messageId: string }>; // now returns IDs
  onDiscard: () => void;
  isSending: boolean;
  threadId: string;
  subject: string;
}

function ReminderDropdown({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const options = [
    { label: "1 hour", value: "1h" },
    { label: "4 hours", value: "4h" },
    { label: "Tomorrow 9 AM", value: "tomorrow" },
    { label: "Monday 9 AM", value: "monday" },
    { label: "Custom…", value: "custom" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            selected === opt.value
              ? "bg-[#5c4dff] text-white border-[#5c4dff]"
              : "bg-[#1a1d27] text-[#8b949e] border-gray-700 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ReplyPanel({
  replyTo,
  body,
  onChangeBody,
  onSend,
  onDiscard,
  isSending,
  threadId,
  subject,
}: ReplyPanelProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [remindOption, setRemindOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState("");

  const createReminder = useCreateReminder();

  const displayPerson = replyTo.from || "Unknown Sender";
  const nameMatch = displayPerson.match(/^([^<]+)/);
  const emailMatch = displayPerson.match(/<([^>]+)>/);
  const displayName = nameMatch ? nameMatch[1].trim() : displayPerson;
  const displayEmailAddress = emailMatch ? emailMatch[1].trim() : displayPerson;

  // Derive the recipient email we're waiting for
  const recipientEmail = displayEmailAddress;

  const computeRemindAfter = (): Date | null => {
    if (!remindOption) return null;
    const now = new Date();
    switch (remindOption) {
      case "1h":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "4h":
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case "tomorrow":
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        return now;
      case "monday":
        now.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7)); // next Monday
        now.setHours(9, 0, 0, 0);
        return now;
      case "custom":
        return customDate ? new Date(customDate) : null;
      default:
        return null;
    }
  };
  const { addToast } = useToast();

  const handleSend = async () => {
    try {
      const result = await onSend(); // { threadId, messageId }
      if (remindOption) {
        const remindAfter = computeRemindAfter();
        if (remindAfter && result.threadId && result.messageId) {
          createReminder.mutate({
            threadId: result.threadId,
            sentMessageId: result.messageId,
            sentAt: new Date().toISOString(),
            remindAfter: remindAfter.toISOString(),
            recipientEmail,
            subject: `Re: ${subject}`,
          });
        } else if (!result.threadId || !result.messageId) {
          addToast(
            "error",
            "Reply sent but reminder could not be created (missing identifiers)",
          );
        }
      }
    } catch (err) {
      // onSend handles its own toasts; no additional action needed
    }
  };

  useHotkeys("ctrl+enter", handleSend, {
    enabled: true,
    enableOnFormTags: true,
  });

  return (
    <div className="mt-4 bg-[#151821] border border-gray-800/80 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
        <p className="text-sm font-semibold text-gray-200">
          Replying to {displayName}{" "}
          <span className="text-[#8b949e] font-normal">
            &lt;{displayEmailAddress}&gt;
          </span>
        </p>
        <button
          onClick={onDiscard}
          className="text-[#8b949e] hover:text-gray-200 transition-colors p-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={body}
        onChange={(e) => onChangeBody(e.target.value)}
        placeholder="Write your reply..."
        rows={6}
        className="w-full bg-transparent px-6 py-4 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none"
      />

      {/* Reminder collapsible section (slides between textarea and footer) */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showReminder ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 border-t border-gray-800/80 bg-[#11141c]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-200">
              ⏱ Remind me if no reply in…
            </h4>
            <button
              onClick={() => {
                setShowReminder(false);
                setRemindOption(null);
                setCustomDate("");
              }}
              className="text-xs text-[#8b949e] hover:text-gray-200"
            >
              Remove
            </button>
          </div>
          <ReminderDropdown
            selected={remindOption}
            onSelect={setRemindOption}
          />
          {remindOption === "custom" && (
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-2 w-full bg-[#0e1116] text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c4dff]"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/80">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={isSending || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#5c4dff] hover:bg-[#4b3be0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            {isSending ? "Sending..." : "Send"}
          </button>
          <button
            onClick={onDiscard}
            className="text-sm text-[#8b949e] hover:text-gray-200 transition-colors"
          >
            Discard
          </button>
        </div>

        <div className="flex items-center gap-2 text-[#8b949e]">
          <button
            onClick={() => setShowReminder(!showReminder)}
            className={`flex items-center p-3 rounded-lg gap-2 transition-all ${
              showReminder
                ? "bg-[#5c4dff] text-white"
                : "bg-transparent hover:text-gray-200 hover:bg-[#1a1d27]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Add Reminder
          </button>

          {/* existing other buttons */}
          <button className="p-2 hover:text-gray-200 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
              />
            </svg>
          </button>
          <button
            onClick={onDiscard}
            className="p-2 hover:text-red-400 transition-colors"
          >
            <svg
              className="w-4 h-4"
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
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReplyPanel;

interface MessageCardProps {
  email: ParsedEmail;
  context: "inbox" | "sent" | "archive" | "trash";
  isLast: boolean;
  onDeleted: () => void;
  onReply: () => void;
}

function MessageCard({
  email,
  context,
  isLast,
  onDeleted,
  onReply,
}: MessageCardProps) {
  const { mutate: toggleStar } = useToggleStar();
  const { mutate: modifyEmail } = useModifyEmail();
  const { mutate: trashEmail } = useTrashEmail();
  const { addToast } = useToast();

  // collapse older messages by default, expand the last one
  const [expanded, setExpanded] = useState(isLast);
  const [showEventModal, setShowEventModal] = useState(false);

  const displayPerson =
    context === "inbox" || context === "archive" || context === "trash"
      ? email.from || "Unknown Sender"
      : email.to || "(No Recipients)";
  const nameMatch = displayPerson.match(/^([^<]+)/);
  const emailMatch = displayPerson.match(/<([^>]+)>/);
  const displayName = nameMatch ? nameMatch[1].trim() : displayPerson;
  const displayEmailAddress = emailMatch ? emailMatch[1].trim() : displayPerson;

  return (
    <div className="bg-[#151821] border border-gray-800/80 rounded-2xl p-8 shadow-xl shadow-black/20">
      {/* Header row: Avatar, Name, Actions */}
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 border ${getAvatarStyle(displayName)}`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-200">{displayName}</span>
            <span className="text-sm text-[#8b949e]">
              {displayEmailAddress}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[#8b949e] text-sm">
            {formatEmailDate(email.internalDate)}
          </span>

          <button
            onClick={() =>
              toggleStar(
                { messageId: email.id, starred: !email.isStarred },
                {
                  onSuccess: () =>
                    addToast(
                      "success",
                      email.isStarred ? "Unstarred" : "Starred",
                    ),
                },
              )
            }
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${email.isStarred ? "text-[#facc15]" : "text-[#8b949e]"}`}
          >
            <svg
              className={`w-5 h-5 ${email.isStarred ? "fill-current" : ""}`}
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
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply();
            }}
            className="p-2 rounded-full text-[#8b949e] hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 7L4 12L9 17"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 12H15C18 12 20 14 20 17"
              />
            </svg>
          </button>

          <div className="relative group">
            <button className="p-2 rounded-full text-[#8b949e] hover:text-gray-200 hover:bg-gray-800 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
              <div className="absolute right-0 mt-2 w-52 bg-[#1a1d27] border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => setShowEventModal(true)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 rounded-t-xl border-b border-gray-700"
                >
                  Create Event
                </button>
                <button
                  onClick={() =>
                    trashEmail(email.id, {
                      onSuccess: () => {
                        addToast("success", "Moved to Trash");
                        onDeleted();
                      },
                    })
                  }
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800"
                >
                  Move to Trash
                </button>
                {context === "archive" && (
                  <button
                    onClick={() =>
                      modifyEmail(
                        { messageId: email.id, unarchive: true },
                        {
                          onSuccess: () => {
                            addToast("success", "Moved to Inbox");
                            onDeleted();
                          },
                        },
                      )
                    }
                    className="w-full text-left px-4 py-3 text-sm text-[#5c4dff] hover:bg-gray-800 rounded-b-xl border-t border-gray-700"
                  >
                    Move to Inbox
                  </button>
                )}
                {context === "trash" && (
                  <button
                    onClick={() =>
                      modifyEmail(
                        { messageId: email.id, untrash: true },
                        {
                          onSuccess: () => {
                            addToast("success", "Restored to Inbox");
                            onDeleted();
                          },
                        },
                      )
                    }
                    className="w-full text-left px-4 py-3 text-sm text-[#5c4dff] hover:bg-gray-800 rounded-b-xl border-t border-gray-700"
                  >
                    Restore from Trash
                  </button>
                )}
                {context !== "archive" && context !== "trash" && (
                  <button
                    onClick={() =>
                      modifyEmail(
                        { messageId: email.id, archive: true },
                        {
                          onSuccess: () => {
                            addToast("success", "Archived");
                            onDeleted();
                          },
                        },
                      )
                    }
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 rounded-b-xl border-t border-gray-700"
                  >
                    Archive
                  </button>
                )}
              </div>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          <div className="border-t border-gray-800/80 mb-6"></div>
          <div className="text-gray-300 leading-relaxed">
            {email.htmlBody ? (
              <EmailHtmlFrame html={email.htmlBody} />
            ) : email.textBody ? (
              <pre className="whitespace-pre-wrap font-sans text-[15px] text-white">
                {email.textBody}
              </pre>
            ) : email.snippet ? (
              <pre className="whitespace-pre-wrap font-sans text-[15px] text-white">
                {email.snippet}
              </pre>
            ) : (
              <p className="text-gray-500 italic">No body content available.</p>
            )}
          </div>
        </>
      )}

      {!expanded && (
        <p className="text-sm text-[#8b949e] truncate">{email.snippet}</p>
      )}

      {/* Create Event Modal — prefilled with email subject */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={null}
        defaultSummary={email.subject !== "(No Subject)" ? email.subject : ""}
      />
    </div>
  );
}
