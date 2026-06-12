import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";

/**
 * POST /api/emails/send
 *
 * Sends a brand-new email (not a draft). Builds MIME and pushes to Gmail.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const body = await request.json();

    const { to = [], cc = [], bcc = [], subject = "", body: emailBody = "", threadId } = body;

    const mimeMessage = [
      `To: ${to.join(", ")}`,
      `Cc: ${cc.join(", ")}`,
      `Bcc: ${bcc.join(", ")}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      emailBody,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    const result = await tenant.gmail.api.messages.send({
      raw,
      threadId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
