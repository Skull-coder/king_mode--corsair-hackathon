import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { plugin } = body;

    if (plugin !== "gmail" && plugin !== "googlecalendar") {
      return new NextResponse("Invalid plugin", { status: 400 });
    }

    await db
      .update(users)
      .set({
        plugins: sql`array_remove(${users.plugins}, ${plugin})`,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove plugin:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
