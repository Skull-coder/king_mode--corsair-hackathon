// AI-powered semantic search — currently disabled in live-fetch mode.
// Previously this queried our local emails table with pgvector embeddings.
// In the new architecture, emails are fetched live from Gmail via Corsair
// and are never stored in our DB. Re-enable when we have a live-fetch
// version of this feature.

// import { db } from '@/lib/db';
// import { sql } from 'drizzle-orm';

interface SearchResult {
  email: unknown;
  similarity: number;
}

export async function searchEmails(
  _userId: string,
  _userQuery: string,
  _limit = 5,
): Promise<SearchResult[]> {
  console.warn("searchEmails: not available in live-fetch mode (no local email DB)");
  return [];
}
