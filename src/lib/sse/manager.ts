/**
 * Simple in-memory SSE manager.
 *
 * Connected clients are stored in a Set. When a webhook fires, we broadcast
 * a "refresh" event to all connected clients. The frontend receives this and
 * invalidates TanStack Query caches.
 */

type SSEClient = {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
};

const clients = new Set<SSEClient>();

export function addSSEClient(client: SSEClient) {
  clients.add(client);
}

export function removeSSEClient(client: SSEClient) {
  clients.delete(client);
}

/**
 * Broadcast a "refresh" signal to all connected SSE clients.
 * Called from the webhook route whenever Corsair sends us a change notification.
 */
export function broadcastRefresh() {
  const message = `data: refresh\n\n`;
  for (const client of clients) {
    try {
      client.controller.enqueue(client.encoder.encode(message));
    } catch {
      // Client disconnected — remove on next cleanup
      clients.delete(client);
    }
  }
}
