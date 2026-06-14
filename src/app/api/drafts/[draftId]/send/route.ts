import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";

/**
 * POST /api/drafts/:draftId/send → send a draft
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { draftId } = await params;

    const result = await tenant.gmail.api.drafts.send({ id: draftId });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error sending draft:", error);
    return NextResponse.json({ error: "Failed to send draft" }, { status: 500 });
  }
}
