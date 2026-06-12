import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair-client";

/**
 * PATCH  /api/calendar/events/:eventId → update event
 * DELETE /api/calendar/events/:eventId → delete event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { eventId } = await params;
    const body = await request.json();

    const result = await tenant.googlecalendar.api.events.update({
      id: eventId,
      event: body,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { eventId } = await params;

    await tenant.googlecalendar.api.events.delete({ id: eventId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error deleting calendar event:", error);
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 });
  }
}
