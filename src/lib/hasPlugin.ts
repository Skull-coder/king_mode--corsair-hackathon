import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

// Helper function to pause execution for a given number of milliseconds
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function hasPlugin(
  userId: string,
  plugin: "gmail" | "googlecalendar",
  maxRetries = 3 // Default to 3 attempts
) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          plugins: true,
        },
      });

      // Added optional chaining (?.) on plugins just in case the array is unexpectedly null
      return user?.plugins?.includes(plugin) ?? false;
      
    } catch (error) {
      attempt++;
      console.warn(`[hasPlugin] Attempt ${attempt} failed for user ${userId}. Retrying...`);

      // If we've reached our maximum retries, throw the error so Next.js error boundaries can catch it
      if (attempt >= maxRetries) {
        console.error(`[hasPlugin] All ${maxRetries} attempts failed:`, error);
        throw error;
      }

      // Exponential backoff: Wait 500ms, then 1000ms before trying again
      await delay(attempt * 500);
    }
  }

  return false;
}