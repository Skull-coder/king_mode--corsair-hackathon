"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

type ApiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawChunk = Record<string, any> & { type: string };

function sanitizeMessagesForApi(messages: Message[]): ApiMessage[] {
  return messages
    .filter((m) => {
      const isValidRole = m.role === "user" || m.role === "assistant";
      const isStringContent = typeof m.content === "string";
      const hasContent = isStringContent && m.content.trim().length > 0;
      const isNotStreamingPlaceholder = !m.isStreaming;
      const isNotError =
        isStringContent && !(m.content as string).startsWith("Error:");

      return (
        isValidRole &&
        isStringContent &&
        hasContent &&
        isNotStreamingPlaceholder &&
        isNotError
      );
    })
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: (m.content as string).trim(),
    }));
}

export default function KingChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const assistantId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const previousMessages = sanitizeMessagesForApi(
      messages.filter((m) => !m.isStreaming),
    );
    const requestMessages: ApiMessage[] = [
      ...previousMessages,
      {
        id: userMessage.id,
        role: "user",
        content: userMessage.content,
      },
    ];

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ messages: requestMessages }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `Error: ${errorText || `HTTP ${res.status}`}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
        return;
      }

      if (!res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Error: No response body",
                  isStreaming: false,
                }
              : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const textsByMsgId = new Map<string, string>();
      let streamFinished = false;

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (!block.startsWith("data: ")) continue;

          const jsonStr = block.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") {
            streamFinished = true;
            break;
          }

          try {
            const chunk: RawChunk = JSON.parse(jsonStr);

            switch (chunk.type) {
              case "start":
                break;
              case "text-start":
                if (chunk.id && !textsByMsgId.has(chunk.id)) {
                  textsByMsgId.set(chunk.id, "");
                }
                break;
              case "text-delta":
                if (chunk.id && typeof chunk.delta === "string") {
                  const existing = textsByMsgId.get(chunk.id) ?? "";
                  textsByMsgId.set(chunk.id, existing + chunk.delta);

                  const fullText = Array.from(textsByMsgId.values()).join("");
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullText }
                        : m,
                    ),
                  );
                }
                break;
              case "text-end":
                break;
              case "finish":
                streamFinished = true;
                break;
              case "error":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: `Error: ${chunk.errorText ?? "Unknown error"}`,
                          isStreaming: false,
                        }
                      : m,
                  ),
                );
                streamFinished = true;
                break;
              default:
                break;
            }
          } catch (err) {
            console.warn("Skipping malformed SSE block:", block, err);
          }
        }
      }

      const remaining = decoder.decode();
      if (remaining) {
        buffer += remaining;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m,
        ),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${errorMessage}`, isStreaming: false }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = user?.firstName || "skull_coder";

  return (
    <div className="flex h-screen flex-col bg-[#0e1116] text-white font-sans selection:bg-[#5c4dff]/30">
      
      {/* Dynamic Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col w-full max-w-4xl mx-auto">
        
        {messages.length === 0 ? (
          // --- EMPTY STATE (Centered) ---
          <div className="flex-1 flex flex-col items-center justify-center p-6 w-full animate-in fade-in duration-500">
            <h1 className="text-4xl md:text-5xl font-semibold mb-10 tracking-tight text-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5c4dff] to-purple-400">
                Hello, {displayName}
              </span>
              <br />
              <span className="text-[#8b949e] text-3xl md:text-4xl mt-2 block">
                How can I help you today?
              </span>
            </h1>

            <div className="w-full max-w-3xl relative group">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message King Mode..."
                className="w-full bg-[#1c212b] border border-gray-800 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-[#8b949e] focus:outline-none focus:border-[#5c4dff]/50 focus:ring-1 focus:ring-[#5c4dff]/50 resize-none overflow-hidden transition-all shadow-lg"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 rounded-xl bg-[#5c4dff] text-white disabled:opacity-40 disabled:bg-gray-700 hover:bg-[#4a3ecc] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          // --- CHAT STATE ---
          <>
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-800"
            >
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      message.role === "user" 
                        ? "bg-[#252b36] text-white rounded-br-sm" 
                        : "bg-transparent text-gray-200"
                    }`}
                  >
                    {message.role === "assistant" && (
                       <div className="flex items-center space-x-2 mb-2 text-[#5c4dff]">
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                         </svg>
                         <span className="text-sm font-semibold tracking-wide uppercase">King Mode</span>
                       </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-[#5c4dff] animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Bottom Pinned Input */}
            <div className="p-4 bg-gradient-to-t from-[#0e1116] via-[#0e1116] to-transparent pt-8">
              <div className="w-full max-w-3xl mx-auto relative group">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to King Mode..."
                  className="w-full bg-[#1c212b] border border-gray-800 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-[#8b949e] focus:outline-none focus:border-[#5c4dff]/50 focus:ring-1 focus:ring-[#5c4dff]/50 resize-none overflow-hidden transition-all shadow-xl"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 p-2 rounded-xl bg-[#5c4dff] text-white disabled:opacity-40 disabled:bg-gray-700 hover:bg-[#4a3ecc] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-xs text-[#8b949e] mt-3">
                King Mode can make mistakes. Verify important information.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}