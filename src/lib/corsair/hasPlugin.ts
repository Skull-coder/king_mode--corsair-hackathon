import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function hasPlugin(
  userId: string,
  plugin: "gmail" | "googlecalendar",
  maxRetries = 10
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

      return user?.plugins?.includes(plugin) ?? false;
      
    } catch (error) {
      attempt++;
      console.warn(`[hasPlugin] Attempt ${attempt} failed for user ${userId}. Retrying...`);

      if (attempt >= maxRetries) {
        console.error(`[hasPlugin] All ${maxRetries} attempts failed:`, error);
        throw error;
      }

      await delay(attempt * 500);
    }
  }

  return false;
}
