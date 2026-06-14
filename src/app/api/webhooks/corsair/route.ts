import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { processWebhook } from "corsair";
import { corsair } from "@/../corsair";
import { broadcastRefresh } from "@/lib/sse/manager";

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

    console.log("Raw webhook body:");
    console.log(JSON.stringify(body, null, 2));

    const headers = Object.fromEntries(request.headers.entries());

    let targetTenantId: string | undefined;

    // Gmail PubSub payload
    if (body?.message?.data) {
      try {
        const decodedString = Buffer.from(
          body.message.data,
          "base64"
        ).toString("utf8");

        const decodedPayload = JSON.parse(decodedString);

        console.log("Decoded Gmail payload:");
        console.log(decodedPayload);

        const incomingEmail = decodedPayload.emailAddress;

        if (incomingEmail) {
          const user = await db.query.users.findFirst({
            where: eq(users.emailAddress, incomingEmail),
          });

          console.log("User lookup result:", {
            incomingEmail,
            userId: user?.id,
            dbEmail: user?.emailAddress,
          });

          if (!user) {
            console.error(
              `No user found for Gmail account: ${incomingEmail}`
            );

            return NextResponse.json(
              {
                success: false,
                error: `No user found for ${incomingEmail}`,
              },
              { status: 404 }
            );
          }

          targetTenantId = user.id;
        }
      } catch (decodeError) {
        console.error(
          "Failed parsing Gmail PubSub payload:",
          decodeError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Invalid Gmail PubSub payload",
          },
          { status: 400 }
        );
      }
    }

    if (!targetTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to resolve tenantId",
        },
        { status: 400 }
      );
    }

    console.log("Processing webhook with tenant:", targetTenantId);

    const result = await processWebhook(corsair, headers, body, {
      tenantId: targetTenantId,
    });

    console.log("Webhook processed successfully");

    broadcastRefresh();

    const responseHeaders = (result as any).responseHeaders ?? {};

    const nextHeaders = new Headers();

    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, String(value));
    }

    if (!result.response) {
      return NextResponse.json(
        {
          success: false,
          message: "No matching webhook handler found",
        },
        {
          status: 404,
          headers: nextHeaders,
        }
      );
    }

    return NextResponse.json(result.response, {
      status: result.response.success ? 200 : 500,
      headers: nextHeaders,
    });
  } catch (error) {
    console.error("Corsair webhook critical failure:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Corsair webhook endpoint is active",
  });
}