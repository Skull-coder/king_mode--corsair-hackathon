import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { getCorsairTenant } from "@/lib/corsair";

// POST – Create a reminder
export async function POST(request: NextRequest) {
  try {
    const { tenant, userId } = await getCorsairTenant();
    const body = await request.json();

    const {
      threadId,
      sentMessageId,
      sentAt,
      remindAfter,
      recipientEmail,
      subject,
    } = body;

    // Basic validation
    if (
      !threadId ||
      !sentMessageId ||
      !sentAt ||
      !remindAfter ||
      !recipientEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        userId,
        threadId,
        sentMessageId,
        sentAt: new Date(sentAt),
        remindAfter: new Date(remindAfter),
        recipientEmail,
        subject: subject || null,
      })
      .returning();

    return NextResponse.json(reminder, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}

// GET – List reminders for current user
export async function GET(request: NextRequest) {
  try {
    const { tenant, userId } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // optional

    // Fetch all reminders for the user
    let allReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(desc(reminders.createdAt));

    // Find all pending reminders
    const pendingReminders = allReminders.filter((r) => r.status === "pending");

    if (pendingReminders.length > 0) {
      // Do a live check on pending reminders
      await Promise.all(
        pendingReminders.map(async (reminder) => {
          try {
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

            if (replyFound) {
              // Update in DB
              await db
                .update(reminders)
                .set({ status: "replied" })
                .where(eq(reminders.id, reminder.id));
              // Update in our local array for the response
              reminder.status = "replied";
            } else if (new Date() >= new Date(reminder.remindAfter)) {
              // It's past the remind time, so it has fired
              await db
                .update(reminders)
                .set({ status: "fired" })
                .where(eq(reminders.id, reminder.id));
              reminder.status = "fired";
            }
          } catch (err) {
            console.error(`Error checking reminder ${reminder.id}:`, err);
          }
        })
      );
    }

    // Apply status filter if provided and valid
    let data = allReminders;
    if (
      statusFilter &&
      ["pending", "fired", "dismissed", "replied"].includes(statusFilter)
    ) {
      data = allReminders.filter((r) => r.status === statusFilter);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}