import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";

/**
 * GET /api/emails/trash?pageToken=xxx
 *
 * Fetches emails in the Gmail Trash folder using the TRASH label.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const listResponse = await tenant.gmail.api.messages.list({
      labelIds: ["TRASH"],
      maxResults: 15,
      pageToken,
    });

    const rawMessages = listResponse.messages || [];

    const enriched = await Promise.all(
      rawMessages.map(async (msg) => {
        if (!msg.id) return null;
        try {
          const full = await tenant.gmail.api.messages.get({
            id: msg.id,
            format: "metadata",
          });
          return parseEmail(full);
        } catch {
          return parseEmail(msg);
        }
      })
    );

    return NextResponse.json({
      messages: enriched.filter(Boolean),
      nextPageToken: listResponse.nextPageToken ?? null,
      resultSizeEstimate: listResponse.resultSizeEstimate ?? 0,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching trashed emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch trashed emails" },
      { status: 500 }
    );
  }
}
