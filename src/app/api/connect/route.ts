import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/../corsair"; // Imports from your root corsair.ts

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const plugin = searchParams.get("plugin") || "googlecalendar"; // 'gmail' or 'googlecalendar'
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`;

    const { url, state } = await generateOAuthUrl(corsair, plugin, {
      tenantId: userId, // Maps Clerk ID to Corsair
      redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || false,
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    console.error(error);
    return new NextResponse("Error", { status: 500 });
  }
}