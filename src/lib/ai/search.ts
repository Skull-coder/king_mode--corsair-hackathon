import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema/users';
import { generateEmbedding } from './embeddings';
import { sql } from 'drizzle-orm';

interface SearchResult {
  email: typeof emails.$inferSelect;
  similarity: number;
}

/**
 * Searches the emails table using vector similarity matching.
 * Returns the closest matches sorted by relevance.
 */
export async function searchEmails(userId: string, userQuery: string, limit = 5): Promise<SearchResult[]> {
  try {
    // 1. Convert the search query string into a 1024-dimension vector using Jina AI
    const queryVector = await generateEmbedding(userQuery);
    
    // Format the vector array as a Postgres-compatible string format: '[0.123,0.456,...]'
    const vectorString = `[${queryVector.join(',')}]`;

    // 2. Query Postgres using Cosine Distance (<=>)
    // In pgvector, lower distance means higher similarity. 
    // Subtracting distance from 1 gives us a clean similarity score from 0 to 1.
    const similarityScore = sql<number>`1 - (${emails.embedding} <=> ${vectorString}::vector)`;

    const results = await db
      .select({
        email: emails,
        similarity: similarityScore,
      })
      .from(emails)
      .where(
        sql`${emails.userId} = ${userId} AND ${emails.embedding} IS NOT NULL`
      )
      .orderBy(sql`${emails.embedding} <=> ${vectorString}::vector`) // Order by closest match first
      .limit(limit);

    return results;

  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}