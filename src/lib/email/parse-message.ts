type GmailHeader = { name?: string; value?: string };

type GmailBody = { data?: string; size?: number };

export type GmailPayload = {
  headers?: GmailHeader[];
  body?: GmailBody;
  parts?: GmailPayload[];
  mimeType?: string;
};

export type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string | number | Date | null;
  payload?: GmailPayload;
  from?: string;
  subject?: string;
  to?: string;
};

export function getHeader(
  headers: GmailHeader[] | undefined,
  name: string,
): string {
  const match = headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  );
  return match?.value?.trim() ?? "";
}

export function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

export type MessageContent = {
  html: string;
  text: string;
};

function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith("<") ||
    /<(html|body|table|div|style|center|!DOCTYPE)/i.test(trimmed)
  );
}

function pickRichestPart(parts: string[]): string {
  if (parts.length === 0) return "";
  return parts.reduce(
    (best, current) => (current.length > best.length ? current : best),
    parts[0],
  );
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function collectMimeParts(
  payload: GmailPayload | undefined,
  htmlParts: string[],
  textParts: string[],
) {
  if (!payload) return;

  if (payload.body?.data) {
    const content = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      htmlParts.push(content);
    } else if (payload.mimeType === "text/plain") {
      textParts.push(content);
    }
  }

  for (const part of payload.parts ?? []) {
    collectMimeParts(part, htmlParts, textParts);
  }
}

export function prepareHtmlForDisplay(html: string): string {
  const quoteMatch = html.match(
    /<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>/i,
  );
  if (!quoteMatch || quoteMatch.index === undefined) return html;

  const main = html.slice(0, quoteMatch.index);
  const quoted = html.slice(quoteMatch.index);
  return `${main}<details class="pulse-email-quote"><summary>Show previous messages</summary>${quoted}</details>`;
}

export function extractMessageContent(
  payload: GmailPayload | undefined,
  cachedBody?: string | null,
): MessageContent {
  const htmlParts: string[] = []
  const textParts: string[] = []

  collectMimeParts(payload, htmlParts, textParts);

  let html = pickRichestPart(htmlParts);
  let text = pickRichestPart(textParts);

  if (cachedBody?.trim()) {
    if (looksLikeHtml(cachedBody)) {
      html ||= cachedBody;
    } else {
      text ||= cachedBody;
    }
  }

  if (html) {
    html = prepareHtmlForDisplay(html);
  }

  if (!text && html) {
    text = stripHtmlToText(html);
  }

  return { html, text };
}

export function extractBody(payload: GmailPayload | undefined): string {
  const { text, html } = extractMessageContent(payload);
  return text || (html ? stripHtmlToText(html) : "");
}

export function formatMessageDate(
  headerDate: string,
  internalDate?: string | number | Date | null,
): string {
  const parsed = headerDate
    ? new Date(headerDate)
    : internalDate != null
      ? new Date(
          typeof internalDate === "number"
            ? internalDate
            : Number(internalDate),
        )
      : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const isToday =
    parsed.getDate() === now.getDate() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear();

  if (isToday) {
    return parsed.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const isThisYear = parsed.getFullYear() === now.getFullYear();

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });
}

export function parseSender(fromHeader: string): string {
  if (!fromHeader) return "Unknown sender";
  const match = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (match?.[1]) return match[1].trim();
  return fromHeader.replace(/<[^>]+>/g, "").trim() || fromHeader;
}

export function getMessageInternalTime(
  message: GmailMessage,
): number {
  const headerDate = getHeader(message.payload?.headers, "Date");
  if (headerDate) {
    const parsed = new Date(headerDate).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (message.internalDate != null) {
    const raw =
      typeof message.internalDate === "number"
        ? message.internalDate
        : Number(message.internalDate);
    if (!Number.isNaN(raw)) return raw;
  }

  return 0;
}

export function toListItem(message: GmailMessage): {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  enriched: boolean;
} | null {
  if (!message.id) return null;

  const headers = message.payload?.headers;
  const fromHeader = message.from || getHeader(headers, "From");
  const subjectHeader = message.subject || getHeader(headers, "Subject");
  const dateHeader = getHeader(headers, "Date");

  return {
    id: message.id,
    threadId: message.threadId ?? message.id,
    from: fromHeader ? parseSender(fromHeader) : "",
    subject: subjectHeader || (fromHeader ? "(No subject)" : ""),
    snippet: message.snippet ?? "",
    date: formatMessageDate(dateHeader, message.internalDate),
    isUnread: message.labelIds?.includes("UNREAD") ?? false,
    enriched: Boolean(fromHeader || subjectHeader),
  };
}
