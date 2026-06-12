import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient } from "@/lib/sse/manager";

/**
 * GET /api/sse
 *
 * Opens a Server-Sent Events stream. The frontend connects here to receive
 * real-time "refresh" signals whenever a Corsair webhook fires.
 */
export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client = { controller, encoder };

      // Send an initial heartbeat so the client knows the connection is alive
      controller.enqueue(encoder.encode(": connected\n\n"));

      addSSEClient(client);

      // Heartbeat every 30 seconds to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          removeSSEClient(client);
        }
      }, 30000);

      // Clean up on abort
      _request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSSEClient(client);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
