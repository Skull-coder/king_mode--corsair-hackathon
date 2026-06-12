import { NextRequest, NextResponse } from "next/server";
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/../corsair";

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
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`;

    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    // Bounce the user back to the frontend
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