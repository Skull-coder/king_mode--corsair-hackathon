import { corsair } from "@/../corsair";
import type { GmailMessage } from "./parse-message";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type GmailKeys = {
  get_access_token: () => Promise<string | null>;
  get_expires_at: () => Promise<string | null>;
  get_refresh_token: () => Promise<string | null>;
  get_integration_credentials: () => Promise<{
    client_id?: string;
    client_secret?: string;
  }>;
  set_access_token: (value: string) => Promise<void>;
  set_expires_at: (value: string) => Promise<void>;
};

export type GmailRawListInput = {
  labelIds?: string[];
  maxResults?: number;
  q?: string;
  pageToken?: string;
};

export type GmailRawListResponse = {
  messages?: GmailMessage[];
  nextPageToken?: string;
};

export type GmailRawGetMessageInput = {
  id: string;
  format?: "full" | "metadata" | "minimal";
  metadataHeaders?: string[];
};

export type GmailRawGetThreadInput = {
  id: string;
  format?: "full" | "metadata" | "minimal";
};

export type GmailRawThread = {
  id?: string;
  messages?: GmailMessage[];
};

function getGmailKeys(tenantId: string): GmailKeys {
  return corsair.withTenant(tenantId).gmail.keys as GmailKeys;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const refreshLocks = new Map<string, Promise<string>>();

async function readStoredGmailToken(tenantId: string) {
  const keys = getGmailKeys(tenantId);
  const accessToken = await keys.get_access_token();
  const expiresAt = Number((await keys.get_expires_at()) ?? 0);
  return { accessToken, expiresAt };
}

async function refreshGmailAccessToken(tenantId: string): Promise<string> {
  const inFlight = refreshLocks.get(tenantId);
  if (inFlight) return inFlight;

  const refresh = (async () => {
    const keys = getGmailKeys(tenantId);
    const refreshToken = await keys.get_refresh_token();
    const credentials = await keys.get_integration_credentials();

    if (!refreshToken || !credentials.client_id || !credentials.client_secret) {
      throw new Error("Gmail OAuth credentials are missing");
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail token refresh failed: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
    await keys.set_access_token(data.access_token);
    await keys.set_expires_at(String(expiresAt));

    tokenCache.set(tenantId, {
      token: data.access_token,
      expiresAt,
    });

    return data.access_token;
  })().finally(() => {
    refreshLocks.delete(tenantId);
  });

  refreshLocks.set(tenantId, refresh);
  return refresh;
}

async function resolveGmailAccessToken(
  tenantId: string,
  forceRefresh = false,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (!forceRefresh) {
    const cached = tokenCache.get(tenantId);
    if (cached && cached.expiresAt > now + 300) {
      return cached.token;
    }
  } else {
    tokenCache.delete(tenantId);
  }

  const stored = await readStoredGmailToken(tenantId);
  if (
    !forceRefresh &&
    stored.accessToken &&
    stored.expiresAt > now + 300
  ) {
    tokenCache.set(tenantId, {
      token: stored.accessToken,
      expiresAt: stored.expiresAt,
    });
    return stored.accessToken;
  }

  if (stored.accessToken && !forceRefresh) {
    tokenCache.set(tenantId, {
      token: stored.accessToken,
      expiresAt: stored.expiresAt,
    });
    return stored.accessToken;
  }

  try {
    return await refreshGmailAccessToken(tenantId);
  } catch {
    if (stored.accessToken) {
      return stored.accessToken;
    }
    throw new Error("Gmail is not connected");
  }
}

async function gmailRawFetch<T>(
  tenantId: string,
  path: string,
  query?: Record<string, string | number | undefined>,
  metadataHeaders?: string[],
): Promise<T> {
  return gmailRawRequest<T>(tenantId, path, { query, metadataHeaders });
}

async function gmailRawRequest<T>(
  tenantId: string,
  path: string,
  options?: {
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
    body?: unknown;
    metadataHeaders?: string[];
  },
): Promise<T> {
  let token = await resolveGmailAccessToken(tenantId);

  async function request(accessToken: string) {
    const url = new URL(`${GMAIL_API}${path}`);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value != null) url.searchParams.set(key, String(value));
      }
    }
    if (options?.metadataHeaders) {
      for (const header of options.metadataHeaders) {
        url.searchParams.append("metadataHeaders", header);
      }
    }

    return fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  }

  let response = await request(token);

  if (response.status === 401) {
    token = await resolveGmailAccessToken(tenantId, true);
    response = await request(token);
  }

  if (!response.ok) {
    throw new Error(`Gmail API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

function encodeGmailRawMessage(message: string) {
  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export type GmailRawSendInput = {
  to: string;
  subject: string;
  body: string;
  from: string;
};

export async function gmailRawSendMessage(
  tenantId: string,
  input: GmailRawSendInput,
) {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const from = input.from.trim();

  if (!to || !subject || !from) {
    throw new Error("To, subject, and from are required to send email");
  }

  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n");

  return gmailRawRequest<{ id?: string }>(tenantId, "/users/me/messages/send", {
    method: "POST",
    body: { raw: encodeGmailRawMessage(mime) },
  });
}

export async function gmailRawGetProfile(tenantId: string) {
  return gmailRawFetch<{ emailAddress?: string }>(tenantId, "/users/me/profile");
}

export async function gmailRawListMessages(
  tenantId: string,
  input: GmailRawListInput,
): Promise<GmailRawListResponse> {
  return gmailRawFetch<GmailRawListResponse>(tenantId, "/users/me/messages", {
    labelIds: input.labelIds?.join(","),
    maxResults: input.maxResults,
    pageToken: input.pageToken,
    q: input.q,
  });
}

export async function gmailRawGetMessage(
  tenantId: string,
  input: GmailRawGetMessageInput,
): Promise<GmailMessage> {
  return gmailRawFetch<GmailMessage>(
    tenantId,
    `/users/me/messages/${input.id}`,
    { format: input.format },
    input.metadataHeaders,
  );
}

export async function gmailRawGetThread(
  tenantId: string,
  input: GmailRawGetThreadInput,
): Promise<GmailRawThread> {
  return gmailRawFetch<GmailRawThread>(
    tenantId,
    `/users/me/threads/${input.id}`,
    { format: input.format },
  );
}
