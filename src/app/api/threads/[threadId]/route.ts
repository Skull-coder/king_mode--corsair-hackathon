import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";

/**
 * GET /api/threads/:threadId → fetch full thread with all messages parsed
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { threadId } = await params;

    const result = await tenant.gmail.api.threads.get({
      id: threadId,
      format: "full",
    });

    return NextResponse.json({
      id: result.id,
      historyId: result.historyId,
      snippet: result.snippet,
      messages: (result.messages || []).map(parseEmail),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching thread:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
