import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema/users";
import { eq, and } from "drizzle-orm";
import { getCorsairTenant } from "@/lib/corsair-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getCorsairTenant();
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["fired", "dismissed", "replied"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Ensure the reminder belongs to the user
    const [updated] = await db
      .update(reminders)
      .set({ status })
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}