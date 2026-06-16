import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/../corsair"; // Imports from your root corsair.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const plugin = searchParams.get("plugin"); // 'gmail' or 'googlecalendar'
    const validPlugins = ["gmail", "googlecalendar"];
    if (!plugin || !validPlugins.includes(plugin))
      throw new Error("invalid plugin");
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`;

    const { url, state } = await generateOAuthUrl(corsair, plugin, {
      tenantId: userId, // Maps Clerk ID to Corsair
      redirectUri: REDIRECT_URI,
    });

    const client = await clerkClient();
    const user = await client.users.getUser(userId!);
    
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
      .where(eq(users.id, userId));

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
