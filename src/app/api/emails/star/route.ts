import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";

/**
 * PATCH /api/emails/star
 *
 * Toggles the STARRED label on a message.
 * Body: { messageId: string, starred: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { messageId, starred } = await request.json();

    if (!messageId || typeof starred !== "boolean") {
      return NextResponse.json(
        { error: "messageId (string) and starred (boolean) are required" },
        { status: 400 }
      );
    }

    const result = await tenant.gmail.api.messages.modify({
      id: messageId,
      addLabelIds: starred ? ["STARRED"] : undefined,
      removeLabelIds: starred ? undefined : ["STARRED"],
    });

    return NextResponse.json({ success: true, starred, message: result });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error toggling star:", error);
    return NextResponse.json({ error: "Failed to toggle star" }, { status: 500 });
  }
}

/**
 * GET /api/emails/star?messageId=xxx
 *
 * Returns whether a message is currently starred.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const msg = await tenant.gmail.api.messages.get({
      id: messageId,
      format: "minimal",
    });

    const isStarred = (msg.labelIds || []).includes("STARRED");

    return NextResponse.json({ messageId, starred: isStarred });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error checking star:", error);
    return NextResponse.json({ error: "Failed to check star status" }, { status: 500 });
  }
}
