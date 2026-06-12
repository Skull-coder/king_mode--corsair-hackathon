/**
 * Parses raw Gmail API message objects into a structured, nullable-safe Email type.
 * Works with both messages.list responses (minimal data) and messages.get responses (full data).
 */

export interface ParsedEmail {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  sizeEstimate: number;

  // Parsed from headers (may be null in list responses without metadata)
  subject: string;
  from: string;
  to: string;
  cc: string;
  bcc: string;
  date: string;

  // Body (only available with format: "full")
  textBody: string | null;
  htmlBody: string | null;

  // Computed
  isUnread: boolean;
  isStarred: boolean;
  isDraft: boolean;
  isSent: boolean;
  isInbox: boolean;
  isImportant: boolean;

  // Draft ID — only set when coming from drafts.list
  draftId?: string;

  // Raw — for debugging
  _raw: unknown;
}

function getHeader(headers: Array<{ name?: string; value?: string }> | undefined, name: string): string {
  if (!headers) return "";
  const h = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

function extractBody(parts: any[] | undefined): { textBody: string | null; htmlBody: string | null } {
  if (!parts || !Array.isArray(parts)) return { textBody: null, htmlBody: null };

  const plainPart = parts.find((p: any) => p.mimeType === "text/plain");
  const htmlPart = parts.find((p: any) => p.mimeType === "text/html");

  const textBody = plainPart?.body?.data
    ? Buffer.from(plainPart.body.data, "base64url").toString("utf-8")
    : null;
  const htmlBody = htmlPart?.body?.data
    ? Buffer.from(htmlPart.body.data, "base64url").toString("utf-8")
    : null;

  return { textBody, htmlBody };
}

export function parseEmail(raw: any): ParsedEmail {
  const id = raw.id || "";
  const threadId = raw.threadId || "";
  const labelIds: string[] = raw.labelIds || [];
  const snippet = raw.snippet || "";
  const internalDate = raw.internalDate || "";
  const sizeEstimate = raw.sizeEstimate || 0;

  const headers: Array<{ name?: string; value?: string }> =
    raw.payload?.headers || [];

  const subject = getHeader(headers, "Subject") || "(No Subject)";
  const from = getHeader(headers, "From") || "";
  const to = getHeader(headers, "To") || "";
  const cc = getHeader(headers, "Cc") || "";
  const bcc = getHeader(headers, "Bcc") || "";
  const date = getHeader(headers, "Date") || "";

  const { textBody, htmlBody } = extractBody(raw.payload?.parts);

  return {
    id,
    threadId,
    labelIds,
    snippet,
    internalDate,
    sizeEstimate,
    subject,
    from,
    to,
    cc,
    bcc,
    date,
    textBody,
    htmlBody,
    isUnread: labelIds.includes("UNREAD"),
    isStarred: labelIds.includes("STARRED"),
    isDraft: labelIds.includes("DRAFT"),
    isSent: labelIds.includes("SENT"),
    isInbox: labelIds.includes("INBOX"),
    isImportant: labelIds.includes("IMPORTANT"),
    _raw: raw,
  };
}

/** Format a date string or timestamp for display */
export function formatEmailDate(internalDate: string | number, isDraft?: boolean): string {
  const date = new Date(typeof internalDate === "string" ? parseInt(internalDate) : internalDate);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isThisYear) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

/** For drafts, show "Edited" instead of just the date */
export function formatDraftDate(internalDate: string | number): string {
  const formatted = formatEmailDate(internalDate);
  return formatted ? `Edited ${formatted}` : "";
}
