import { NextRequest, NextResponse } from "next/server";
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/../corsair";
import { waitUntil } from "@vercel/functions";
import { syncHistoricalEmails } from "@/lib/integrations/gmail/sync";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Maps to your Clerk userId

  if (!code || !state) {
    return new NextResponse("Invalid request parameters", { status: 400 });
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return new NextResponse("State verification mismatch", { status: 400 });
  }

  try {
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`;
    
    // 1. Process handshake, exchange tokens, and securely save them in Corsair
    const result = await processOAuthCallback(corsair, { 
      code, 
      state, 
      redirectUri: REDIRECT_URI 
    });

    const tenantId = result.tenantId;

    // 2. Trigger the 30-day historical email sync in the background if they connected Gmail
    // (Since watch is running via CLI, we just run the ingest worker here)
    if (result.plugin === "gmail") {
      waitUntil(syncHistoricalEmails(tenantId));
    }

    // 3. Instantly bounce the user back to your frontend dashboard layout
    const response = NextResponse.redirect(
      new URL(`/dashboard?connected=${result.plugin}`, request.url)
    );
    response.cookies.delete("oauth_state");
    return response;

  } catch (error) {
    console.error("OAuth Exchange Failed:", error);
    return new NextResponse("OAuth handshake failed", { status: 500 });
  }
}