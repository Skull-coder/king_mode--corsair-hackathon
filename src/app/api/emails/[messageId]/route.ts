import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";

/**
 * GET    /api/emails/:messageId  → fetch single email (full format, parsed)
 * PATCH  /api/emails/:messageId  → star / mark read / archive / unarchive / untrash
 * DELETE /api/emails/:messageId  → move to trash (Gmail trash, NOT permanent delete)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { messageId } = await params;

    const result = await tenant.gmail.api.messages.get({
      id: messageId,
      format: "full",
    });

    return NextResponse.json(parseEmail(result));
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching email:", error);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { messageId } = await params;
    const body = await request.json();

    // ── Untrash: restore from Trash back to Inbox ─────────────────────────────
    // Must be handled before the generic modify block since it's a separate API call.
    if (body.untrash === true) {
      const result = await tenant.gmail.api.messages.untrash({ id: messageId });
      return NextResponse.json(result);
    }

    // ── Label modifications ───────────────────────────────────────────────────
    const addLabelIds: string[] = [];
    const removeLabelIds: string[] = [];

    // star / unstar
    if (body.star === true) addLabelIds.push("STARRED");
    if (body.star === false) removeLabelIds.push("STARRED");

    // read / unread
    if (body.read === true) removeLabelIds.push("UNREAD");
    if (body.read === false) addLabelIds.push("UNREAD");

    // archive (remove INBOX label)
    if (body.archive === true) removeLabelIds.push("INBOX");

    // unarchive (add INBOX label back)
    if (body.unarchive === true) addLabelIds.push("INBOX");

    if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
      return NextResponse.json({ error: "No valid action specified" }, { status: 400 });
    }

    const result = await tenant.gmail.api.messages.modify({
      id: messageId,
      addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
      removeLabelIds: removeLabelIds.length > 0 ? removeLabelIds : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error modifying email:", error);
    return NextResponse.json({ error: "Failed to modify email" }, { status: 500 });
  }
}

/**
 * Moves the message to Trash. Google does NOT allow permanent deletion via API
 * for user messages — trash is the only supported removal action.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { messageId } = await params;

    await tenant.gmail.api.messages.trash({ id: messageId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error trashing email:", error);
    return NextResponse.json({ error: "Failed to move email to trash" }, { status: 500 });
  }
}
