import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";
import { eventUpdateSchema } from "@/lib/validations/calendar-event";

/**
 * GET /api/calendar/events/:event:id -> get an event
 * PATCH  /api/calendar/events/:eventId → update event
 * DELETE /api/calendar/events/:eventId → delete event
 */

export async function GET(request: NextRequest,{ params }: { params: Promise<{ eventId: string }> }){
  try {
    
    const { tenant } = await getCorsairTenant();
    const { eventId } = await params;

    const result = await tenant.googlecalendar.api.events.get({
      id: eventId
    })

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { tenant } = await getCorsairTenant();
    const { eventId } = await params;

    // 1. Validate the incoming body
    const body = await request.json();
    const parsed = eventUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 2. Update the event with validated fields
    const result = await tenant.googlecalendar.api.events.update({
      id: eventId,
      event: parsed.data,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to update calendar event" },
      { status: 500 }
    );
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
