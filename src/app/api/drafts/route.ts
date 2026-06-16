import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { parseEmail } from "@/lib/email";
import { normalizeRecipients } from "@/lib/email";

/**
 * GET  /api/drafts              → list drafts with pagination
 * POST /api/drafts              → create a new draft
 *
 * Drafts already include their message data (headers, body) from drafts.list,
 * so no extra per-message fetch is needed. Just parse and return.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);

    const pageToken = searchParams.get("pageToken") || undefined;

    const result = await tenant.gmail.api.drafts.list({
      maxResults: 15,
      pageToken,
    });

    const drafts = (result.drafts || []).map((d) => {
      const parsed = d.message ? parseEmail(d.message) : null;
      return parsed ? { ...parsed, draftId: d.id } : null;
    });

    return NextResponse.json({
      messages: drafts.filter(Boolean),
      nextPageToken: result.nextPageToken ?? null,
      resultSizeEstimate: result.resultSizeEstimate ?? 0,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching drafts:", error);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const body = await request.json();

    const { to = [], cc = [], bcc = [], subject = "", body: draftBody = "", threadId } = body;

    const toArr = normalizeRecipients(to);
    const ccArr = normalizeRecipients(cc);
    const bccArr = normalizeRecipients(bcc);

    const mimeMessage = [
      `To: ${toArr.join(", ")}`,
      `Cc: ${ccArr.join(", ")}`,
      `Bcc: ${bccArr.join(", ")}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      draftBody,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    const result = await tenant.gmail.api.drafts.create({
      draft: { message: { raw, threadId } },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error creating draft:", error);
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
