import { deepseekClient } from './client';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function summarizeEmail(emailId: string): Promise<string> {
  try {
    // 1. Fetch the exact email from your database
    const emailRecord = await db.query.emails.findFirst({
      where: eq(emails.id, emailId)
    });

    if (!emailRecord) throw new Error("Email not found in database");

    // 2. Ask DeepSeek to compress it
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a highly efficient executive assistant. Summarize the provided email into range of 3-5 concise bullet points. Focus on actions, deadlines, and core facts. Do not use conversational filler."
        },
        {
          role: "user",
          content: `Subject: ${emailRecord.subject}\n\nBody: ${emailRecord.rawBody}`
        }
      ],
      temperature: 0.2, // Keep it highly factual
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || "Could not generate summary.";

  } catch (error) {
    console.error("Summarization failed:", error);
    return "Error generating summary.";
  }
}