import "dotenv/config"
import { deepseekClient } from "./client";

// Matches the exact enum strings from your schema.ts
export type PriorityLevel = "critical" | "important" | "normal" | "newsletter" | "low" | "pending";

export async function classifyEmail(emailContent: string): Promise<PriorityLevel> {
  try {
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat", // Lightning fast for classification tasks
      messages: [
        {
          role: "system",
          content: `You are a strict, automated email triage system. Read the email and classify its priority. 
          You must respond with EXACTLY ONE of the following words: critical, important, normal, newsletter, low. 
          Do not include punctuation, reasoning, markdown, or any other text.`
        },
        {
          role: "user",
          content: emailContent
        }
      ],
      temperature: 0.1, // Forces highly deterministic, uncreative output
      max_tokens: 10,   // Prevents the model from writing a long response
    });
    // Clean up the output to ensure it matches the database Enum
    const rawOutput = response.choices[0]?.message?.content?.trim().toLowerCase() || "pending";
    
    // Safely type-check the AI's response before saving to Postgres
    const validPriorities = ["critical", "important", "normal", "newsletter", "low"];
    if (validPriorities.includes(rawOutput)) {
      return rawOutput as PriorityLevel;
    }
    
    // If the model hallucinates or fails, default to pending so you can manually review it
    return "pending";

  } catch (error) {
    console.error("Failed to classify email via DeepSeek:", error);
    return "pending";
  }
}

