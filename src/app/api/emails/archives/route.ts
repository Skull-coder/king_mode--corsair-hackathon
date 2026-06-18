import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";

/**
 * GET /api/emails/archives?pageToken=xxx
 *
 * Fetches archived emails — messages that are NOT in INBOX, SENT, DRAFT, TRASH, or SPAM.
 * In Gmail these live in "All Mail" but have no INBOX label.
 * We use the search query "in:anywhere -in:inbox -in:sent -in:draft -in:trash -in:spam"
 * to get only truly archived user emails.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const listResponse = await tenant.gmail.api.messages.list({
      q: "in:anywhere -in:inbox -in:sent -in:draft -in:trash -in:spam",
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
    console.error("Error fetching archived emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch archived emails" },
      { status: 500 }
    );
  }
}
