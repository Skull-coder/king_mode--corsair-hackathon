import { createBaseMcpServer } from "@corsair-dev/mcp"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { corsair } from "@/../corsair"
import  {ensureCorsairTenant}  from "@/lib/ensureCorsairTenant"

import { sendGmailPlainViaCorsair } from "./gmail-send-plain"

// Asia/Kolkata is UTC+05:30
const TIMEZONE_OFFSETS: Record<string, string> = {
  "Asia/Kolkata": "+05:30",
  "Asia/Colombo": "+05:30",
  "America/New_York": "-05:00",
  "America/Los_Angeles": "-08:00",
  "Europe/London": "+00:00",
  "Europe/Paris": "+01:00",
  // add more as needed
};



function ensureRfc3339(dateTime: string, timeZone?: string): string {
  // Already has offset or Z — leave it alone
  if (/[Z+\-]\d{2}:?\d{2}$/.test(dateTime) && dateTime.includes('T')) {
    return dateTime;
  }
  // Bare datetime like "2026-06-16T09:00:00" — append offset
  const offset = timeZone ? (TIMEZONE_OFFSETS[timeZone] ?? "+00:00") : "+00:00";
  return `${dateTime}${offset}`;
}

export function patchCalendarInput(toolName: string, input: Record<string, any>) {
  if (toolName !== "googlecalendar:events.create" && toolName !== "googlecalendar:events.update") {
    return input;
  }
  const patched = { ...input };
  
  if (patched.start?.dateTime) {
    patched.start = {
      ...patched.start,
      dateTime: ensureRfc3339(patched.start.dateTime, patched.start.timeZone),
    };
  }
  if (patched.end?.dateTime) {
    patched.end = {
      ...patched.end,
      dateTime: ensureRfc3339(patched.end.dateTime, patched.end.timeZone),
    };
  }

  // Always include calendarId if missing
  if (!patched.calendarId) {
    patched.calendarId = "primary";
  }

  return patched;
}
type McpSession = {
  server: McpServer
  transport: WebStandardStreamableHTTPServerTransport
}

declare global {
  var __pulseMcpSessions: Map<string, McpSession> | undefined
}

/** Shared across route handlers, in-memory Maps reset per module otherwise. */
const sessions =
  globalThis.__pulseMcpSessions ?? new Map<string, McpSession>()
globalThis.__pulseMcpSessions = sessions

function cleanup(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return

  session.transport.close()
  session.server.close()
  sessions.delete(sessionId)
}

function createTenantMcpServer(tenantId: string) {
  const server = createBaseMcpServer({
    corsair: corsair.withTenant(tenantId),
    setup: true,
    tenantId,
  })

  server.registerTool(
    "gmail_send_plain",
    {
      description:
        "Send a plain-text Gmail message. Use this instead of gmail.api.messages.send in run_script. Accepts to, subject, and body; builds RFC822 server-side via Corsair.",
      inputSchema: z.object({
        to: z.email().describe("Recipient email address"),
        subject: z.string().min(1).describe("Email subject line"),
        body: z.string().min(1).describe("Plain-text email body"),
      }),
    },
    async ({ to, subject, body }) => {
      try {
        const result = await sendGmailPlainViaCorsair(tenantId, {
          to,
          subject,
          body,
        })
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to send email: ${message}` }],
        }
      }
    },
  )

  return server
}

function registerSession(
  sessionId: string,
  server: McpServer,
  transport: WebStandardStreamableHTTPServerTransport,
) {
  sessions.set(sessionId, { server, transport })
}

async function patchMcpRequest(request: Request): Promise<Request> {
  let body: any
  try {
    body = await request.json()
  } catch {
    // Not JSON or empty body — pass through unchanged
    return request
  }

  const isToolCall =
    body?.method === "tools/call" &&
    typeof body?.params?.name === "string" &&
    body?.params?.arguments !== undefined

  if (!isToolCall) {
    // Reconstruct with the already-consumed body, no changes
    return new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    })
  }

  const patched = patchCalendarInput(body.params.name, body.params.arguments)

  const patchedBody = {
    ...body,
    params: {
      ...body.params,
      arguments: patched,
    },
  }

  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(patchedBody),
  })
}

export async function handleMcpRequest(request: Request, tenantId: string) {
  const sessionId = request.headers.get("mcp-session-id")

  if (request.method === "DELETE") {
    if (sessionId) cleanup(sessionId)
    return new Response(null, { status: 200 })
  }

  if (request.method === "GET") {
    if (!sessionId || !sessions.has(sessionId)) {
      return Response.json(
        { error: "Missing or invalid mcp-session-id" },
        { status: 400 },
      )
    }
    return sessions.get(sessionId)!.transport.handleRequest(request)
  }

  if (request.method === "POST") {
    // Patch the request before it hits the transport
    request = await patchMcpRequest(request)

    if (sessionId) {
      const session = sessions.get(sessionId)
      if (!session) {
        return Response.json({ error: "Session not found" }, { status: 404 })
      }
      return session.transport.handleRequest(request)
    }

    const isValid = await ensureCorsairTenant(tenantId)
    if (!isValid) throw new Error("unauthorized")

    try {
      const server = createTenantMcpServer(tenantId)

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          registerSession(id, server, transport)
        },
        onsessionclosed: (id) => {
          cleanup(id)
        },
      })

      await server.connect(transport)
      const response = await transport.handleRequest(request)

      if (transport.sessionId) {
        registerSession(transport.sessionId, server, transport)
      }

      return response
    } catch (error: any) {
      throw new Error("got error in creating tenantMCP server", error)
    }
  }

  return new Response("Method Not Allowed", { status: 405 })
}