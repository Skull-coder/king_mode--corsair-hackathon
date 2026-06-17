import { NextRequest, NextResponse } from "next/server";
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/../corsair";
import { env } from "@/env";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Invalid request parameters", { status: 400 });
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return new NextResponse("State verification mismatch", { status: 400 });
  }

  try {
    const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/auth`;

    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    const tenantId = result.tenantId;
    const plugin = result.plugin;

    // Only record the plugin AFTER the user has successfully granted permissions
    await db
      .update(users)
      .set({
        plugins: sql`
          CASE
            WHEN ${plugin} = ANY(${users.plugins})
            THEN ${users.plugins}
            ELSE array_append(${users.plugins}, ${plugin})
          END
        `,
      })
      .where(eq(users.id, tenantId));

    // Bounce the user back to the frontend
    const response = NextResponse.redirect(
      new URL(`/email/inbox?connected=${plugin}`, request.url),
    );
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("OAuth Exchange Failed:", error);
    return new NextResponse("OAuth handshake failed", { status: 500 });
  }
}
