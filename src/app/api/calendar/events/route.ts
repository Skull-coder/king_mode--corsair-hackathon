import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";

/**
 * GET    /api/calendar/events              → list events with pagination
 * POST   /api/calendar/events              → create event
 */
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);

    const pageToken = searchParams.get("pageToken") || undefined;
    const timeMin = searchParams.get("timeMin") || undefined;
    const timeMax = searchParams.get("timeMax") || undefined;

    const result = await tenant.googlecalendar.api.events.getMany({
      maxResults: 15,
      pageToken,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await getCorsairTenant();
    const body = await request.json();

    const result = await tenant.googlecalendar.api.events.create({
      event: body,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error creating calendar event:", error);
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}
