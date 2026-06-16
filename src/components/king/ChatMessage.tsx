"use client";

import { useUser } from "@clerk/nextjs";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

function formatContent(text: string): string {
  // Basic markdown formatting for display
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='rounded bg-zinc-700 px-1 py-0.5 text-sm text-amber-300'>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useUser();
  const isUser = message.role === "user";

  const userName = user?.firstName ?? user?.fullName ?? "KING";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={userName}
              className="h-8 w-8 rounded-full border border-zinc-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#284d7d] bg-[#1e3a5f] text-sm font-semibold text-[#60a5fa]">
              {userInitial}
            </div>
          )
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-sm font-bold text-black shadow-md shadow-amber-500/20">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14.178 2a2 2 0 01-1.957 1.582H6.779a2 2 0 01-1.957-1.582L4 13h16l-.822 5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Name label */}
        <div
          className={`mb-1 text-xs font-medium ${
            isUser ? "text-right text-[#60a5fa]" : "text-left text-amber-400"
          }`}
        >
          {isUser ? userName : "KING AI"}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-[#1e3a5f] text-zinc-100"
              : "rounded-tl-md bg-[#151821] border border-zinc-700/50 text-zinc-200"
          }`}
        >
          {message.isStreaming && !message.content ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]" />
            </span>
          ) : (
            <span
              dangerouslySetInnerHTML={{
                __html: formatContent(message.content),
              }}
            />
          )}

          {/* Streaming cursor */}
          {message.isStreaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-amber-400 align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
