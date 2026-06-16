import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema/users";
import { eq, and, lte } from "drizzle-orm";
import { corsair } from "@/../corsair"; // your server-side Corsair client

// Helper: concurrency-limited async pool
async function asyncPool<T>(
  limit: number,
  items: T[],
  fn: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = new Array(limit).fill(null).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function GET(request: NextRequest) {
  // Authenticate using the built-in Vercel cron header
  if (request.headers.get("x-vercel-cron") !== "true") {
    console.log("error in cron/check-reminders !")
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const now = new Date();
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(
        and(eq(reminders.status, "pending"), lte(reminders.remindAfter, now)),
      );

    let fired = 0;
    let replied = 0;

    await asyncPool( 15, dueReminders, async (reminder) => {
      try {
        // 🔥 Create tenant for the specific user – no Clerk session needed
        const tenant = corsair.withTenant(reminder.userId);

        const thread = await tenant.gmail.api.threads.get({
          id: reminder.threadId,
        });

        const replyFound = (thread.messages ?? []).some((msg: any) => {
          const headers: any[] = msg.payload?.headers ?? [];


          const from =
            headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
          const dateStr =
            headers.find((h) => h.name?.toLowerCase() === "date")?.value;
          const msgId =
            headers.find((h) => h.name?.toLowerCase() === "message-id")
              ?.value ?? "";

          if (!dateStr) return false;
          const msgDate = new Date(dateStr).getTime();
          const sentDate = new Date(reminder.sentAt).getTime();

          return (
            msgDate > sentDate &&
            from
              .toLowerCase()
              .includes(reminder.recipientEmail.toLowerCase()) &&
            msgId !== reminder.sentMessageId
          );
        });

        const newStatus = replyFound ? "replied" : "fired";
        await db
          .update(reminders)
          .set({ status: newStatus })
          .where(eq(reminders.id, reminder.id));

        if (newStatus === "fired") fired++;
        else replied++;
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
      }
    });

    return NextResponse.json({
      processed: dueReminders.length,
      fired,
      replied,
    });
  } catch (error) {
    console.error("Cron check-reminders failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}