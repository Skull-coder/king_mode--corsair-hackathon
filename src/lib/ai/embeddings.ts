import "dotenv/config"
import { jinaClient } from "./client";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await jinaClient.embeddings.create({
      model: 'jina-embeddings-v5-text-small', // State-of-the-art 1024-dim model
      input: text,
      dimensions: 1024, // Matches your Drizzle schema
    });

    return response.data[0].embedding;
    
  } catch (error) {
    console.error("Failed to generate embedding via Jina:", error);
    // In a production app, you might want to return a fallback array or throw to trigger a retry
    throw new Error("Embedding generation failed");
  }
}