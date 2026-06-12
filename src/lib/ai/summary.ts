// AI email summarization — currently disabled in live-fetch mode.
// Previously this read from our local emails table.
// In the new architecture, emails are fetched live from Gmail via Corsair.
// Re-enable by accepting raw email content instead of an emailId.

// import { deepseekClient } from './client';

export async function summarizeEmail(_emailId: string): Promise<string> {
  console.warn("summarizeEmail: not available in live-fetch mode (no local email DB)");
  return "Summarization unavailable in live-fetch mode.";
}
