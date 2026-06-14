import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { getCorsairTenant } from "@/lib/corsair-client";

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
    const { userId } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // optional

    // Fetch all reminders for the user
    const allReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(desc(reminders.createdAt));

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