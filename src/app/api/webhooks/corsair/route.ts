import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { processWebhook } from "corsair";
import { corsair } from "@/../corsair";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text?.trim() ? text : {};
    }

    const headers = Object.fromEntries(request.headers.entries());

    // 1. DYNAMIC TENANT RESOLUTION
    let targetTenantId = "default";

    if (body?.message?.data) {
      try {
        const decodedString = Buffer.from(body.message.data, "base64").toString("utf-8");
        const decodedPayload = JSON.parse(decodedString);
        const incomingEmail = decodedPayload.emailAddress;

        if (incomingEmail) {
          const match = await db
            .select()
            .from(users)
            .where(eq(users.emailAddress, incomingEmail))
            .limit(1);

          if (match[0]) {
            targetTenantId = match[0].id;
          }
        }
      } catch (decodeError) {
        console.error("❌ Failed parsing tenant email from PubSub payload:", decodeError);
      }
    }

    // 2. Process webhook through Corsair (This automatically runs the hook configured above!)
    const result = await processWebhook(corsair, headers, body, {
      tenantId: targetTenantId,
    });

    console.log("✅ Webhook processed and pipeline complete.");

    // 3. Prepare response headers
    const responseHeaders = (result as any).responseHeaders ?? {};
    const nextHeaders = new Headers();
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, String(value));
    }

    if (!result.response) {
      return NextResponse.json(
        { success: false, message: "No matching webhook handler found" },
        { status: 404, headers: nextHeaders },
      );
    }

    return NextResponse.json(result.response, {
      status: result.response.success ? 200 : 500,
      headers: nextHeaders,
    });
  } catch (error) {
    console.error("Corsair webhook critical failure:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Corsair webhook endpoint is active",
  });
}