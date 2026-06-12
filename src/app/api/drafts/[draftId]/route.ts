import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";

/**
 * PATCH  /api/drafts/:draftId → update a draft
 * DELETE /api/drafts/:draftId → delete a draft
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { draftId } = await params;
    const body = await request.json();

    const { to = [], cc = [], bcc = [], subject = "", body: draftBody = "", threadId } = body;

    const mimeMessage = [
      `To: ${to.join(", ")}`,
      `Cc: ${cc.join(", ")}`,
      `Bcc: ${bcc.join(", ")}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      draftBody,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    const result = await tenant.gmail.api.drafts.update({
      id: draftId,
      draft: { message: { raw, threadId } },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error updating draft:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { draftId } = await params;

    await tenant.gmail.api.drafts.delete({ id: draftId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error deleting draft:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
