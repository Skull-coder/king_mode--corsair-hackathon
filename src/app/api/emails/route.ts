import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";
import { parseEmail } from "@/lib/email-parser";

/**
 * GET /api/emails?label=INBOX&pageToken=xxx
 *
 * Fetches 15 emails at a time by Gmail label. Each message is enriched
 * with full headers (Subject, From, To, Date) via a parallel metadata fetch.
 * 15 parallel calls is well within Gmail's rate limits.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);

    const label = searchParams.get("label") || "INBOX";
    const pageToken = searchParams.get("pageToken") || undefined;

    // 1. List messages — get IDs and nextPageToken
    const listResponse = await tenant.gmail.api.messages.list({
      labelIds: [label],
      maxResults: 15,
      pageToken,
    });

    const rawMessages = listResponse.messages || [];

    // 2. Fetch metadata (headers) for each message in parallel.
    //    15 calls is safe — Gmail allows 250/sec per user.
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
          // Fallback to whatever the list gave us
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
    console.error("Error fetching emails:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
