// src/lib/integrations/gmail/sync.ts
import { corsair } from "@/../corsair"; 
import { db } from "@/lib/db";
import { emails, threads } from "@/lib/db/schema/users";

// 1. Bring in your exact AI functions
import { generateEmbedding } from "@/lib/ai/embeddings";
import { classifyEmail } from "@/lib/ai/classify";

export async function syncHistoricalEmails(tenantId: string) {
  console.log(`Starting 30-day historical sync + AI Processing for tenant: ${tenantId}`);
  
  try {
    const tenant = corsair.withTenant(tenantId);

    const listResponse = await tenant.gmail.api.messages.list({
      userId: "me",
      q: "newer_than:30d", 
      maxResults: 10, 
    });

    const messages = listResponse.messages || [];
    if (messages.length === 0) return;

    // We use a for...of loop to process one email at a time. 
    // This prevents you from spamming DeepSeek/Jina with 50 requests in the exact same millisecond.
    for (const msg of messages) {
      if (!msg.id) continue;

      try {
        const fullMsg = await tenant.gmail.api.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = fullMsg.payload?.headers || [];
        const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
        const sender = headers.find(h => h.name === "From")?.value || "Unknown Sender";
        const snippet = fullMsg.snippet || "";

        let rawBodyText = snippet;
        const encodedBody = fullMsg.payload?.body?.data || fullMsg.payload?.parts?.[0]?.body?.data;
        if (encodedBody) {
          rawBodyText = Buffer.from(encodedBody, 'base64').toString('utf-8');
        }

        // 2. Format the context for the AI
        const emailContext = `Subject: ${subject}\n\nBody: ${rawBodyText}`;

        // 3. Fire DeepSeek and Jina simultaneously for this specific email
        // If Jina throws an error, the catch block below will grab it so the loop doesn't die.
        const [embeddingArray, priorityLevel] = await Promise.all([
          generateEmbedding(emailContext),
          classifyEmail(emailContext)
        ]);

        // 4. Ensure the thread exists (FK constraint)
        await db.insert(threads).values({
          id: fullMsg.threadId!,
          userId: tenantId,
          subject,
          lastMessageAt: new Date(Number(fullMsg.internalDate)),
        }).onConflictDoNothing();

        // 5. Save the fully hydrated row to Postgres
        await db.insert(emails).values({
          id: msg.id,
          threadId: fullMsg.threadId!,
          userId: tenantId,
          subject,
          sender,
          bodySnippet: snippet,
          rawBody: rawBodyText,
          embedding: embeddingArray, // Vector injected!
          priority: priorityLevel,   // DeepSeek classification injected!
          receivedAt: new Date(Number(fullMsg.internalDate)),
        }).onConflictDoNothing(); 

      } catch (emailError) {
        // If DeepSeek or Jina fail on one specific email, log it and move to the next one
        console.error(`Skipping email ${msg.id} due to processing error:`, emailError);
        continue; 
      }
    }

    console.log(`Successfully synced and processed ${messages.length} historical emails!`);
  } catch (error) {
    console.error("Historical sync failed:", error);
  }
}