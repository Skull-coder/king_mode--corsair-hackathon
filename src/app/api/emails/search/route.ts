import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";

/**
 * GET /api/emails/search?q=hello+world&pageToken=xxx
 *
 * Searches emails via Gmail's search query syntax.
 * Enriches each result with full headers via parallel metadata fetch.
 * 15 results per page to stay within rate limits.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || "";
    const pageToken = searchParams.get("pageToken") || undefined;

    const listResponse = await tenant.gmail.api.messages.list({
      q,
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
    console.error("Error searching emails:", error);
    return NextResponse.json({ error: "Failed to search emails" }, { status: 500 });
  }
}
