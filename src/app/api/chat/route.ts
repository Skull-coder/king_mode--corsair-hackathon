// app/api/chat/route.ts
import { createVercelAiMcpClient } from "@corsair-dev/mcp"
import { createOpenAI } from "@ai-sdk/openai";
import { openai } from "@ai-sdk/openai"
import { streamText, stepCountIs } from "ai"
import { auth } from "@clerk/nextjs/server"
import { buildKingSystemPrompt } from "@/lib/ai"
import { getUserLocale } from "@/lib/locale"
import { hasPlugin } from "@/lib/corsair";

export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// What the frontend actually sends
type IncomingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages: IncomingMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  const provider = req.headers.get("x-provider") || "openrouter";
  const modelName = req.headers.get("x-model-name") || "google/gemma-4-31b-it:free";

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key is missing. Please configure it in your Settings or Key Modal." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let baseUrl = "https://api.openai.com/v1";
  if (provider === "openrouter") {
    baseUrl = "https://openrouter.ai/api/v1";
  } else if (provider === "gemini") {
    baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
  }

  const customOpenAI = createOpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
  });

  const { messages: rawMessages } = body;

  // Validate and convert to CoreMessage[] — the AI SDK's internal format.
  // Our frontend sends { role, content: string }, which maps cleanly to this.
  const coreMessages = rawMessages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.trim(),
    }));

  if (coreMessages.length === 0) {
    return new Response(JSON.stringify({ error: "No valid messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const gmailConnected = await hasPlugin(userId, "gmail");
  const calendarConnected = await hasPlugin(userId, "googlecalendar");
  const hasConnectedIntegration = gmailConnected || calendarConnected;

  let mcpClient: Awaited<ReturnType<typeof createVercelAiMcpClient>> | undefined;

  try {
    const locale = await getUserLocale(userId);

    const webSearchTool = openai.tools.webSearch({
      searchContextSize: "medium",
      userLocation: {
        type: "approximate",
        country: locale.country,
        timezone: locale.timezone,
      },
    });

    const mergedTools = hasConnectedIntegration
      ? await (async () => {
          mcpClient = await createVercelAiMcpClient({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`,
            headers: { cookie: req.headers.get("cookie") ?? "" },
          });
          const mcpTools = await mcpClient.tools();
          console.log("MCP tools:", Object.keys(mcpTools));
          return { ...mcpTools };
        })()
      : undefined;

    const tools =
      mergedTools && Object.keys(mergedTools).length > 0
        ? (mergedTools as NonNullable<Parameters<typeof streamText>[0]["tools"]>)
        : undefined;

    const system = mcpClient?.instructions
      ? `${buildKingSystemPrompt({ gmailConnected, calendarConnected, timezone: locale.timezone, country: locale.country })}\n\n${mcpClient.instructions}`
      : buildKingSystemPrompt({ gmailConnected, calendarConnected, timezone: locale.timezone, country: locale.country });

    const result = streamText({
      model: customOpenAI.chat(modelName),
      system,
      messages: coreMessages,
      tools,
      stopWhen: stepCountIs(20),
      providerOptions: {
        openai: { parallelToolCalls: false },
      },
      onFinish: async () => {
        await mcpClient?.close();
      },
    });

    // Stream in the exact format the frontend already parses:
    // data: {"type":"start"}
    // data: {"type":"text-start","id":"t1"}
    // data: {"type":"text-delta","id":"t1","delta":"..."}
    // data: {"type":"text-end","id":"t1"}
    // data: {"type":"finish"}
    const textId = "t1";
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        try {
          send({ type: "start" });
          send({ type: "text-start", id: textId });

          for await (const chunk of result.textStream) {
            send({ type: "text-delta", id: textId, delta: chunk });
          }

          send({ type: "text-end", id: textId });
          send({ type: "finish" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send({ type: "error", errorText: msg });
        } finally {
          controller.close();
          await mcpClient?.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    await mcpClient?.close();
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat route error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}