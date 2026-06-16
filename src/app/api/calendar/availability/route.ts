import { NextRequest, NextResponse } from "next/server";
import { getCorsairTenant } from "@/lib/corsair";


export async function GET(request: Request) {
  try {
    const { tenant } = await getCorsairTenant();
    const { searchParams } = new URL(request.url);

    const timeZone = searchParams.get("timeZone") || undefined;
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      throw new Error("timeMin and timeMax are required");
    }

    const minDate = new Date(timeMin);
    const maxDate = new Date(timeMax);

    if (isNaN(minDate.getTime())) {
      throw new Error("Invalid timeMin. Must be RFC3339 datetime.");
    }

    if (isNaN(maxDate.getTime())) {
      throw new Error("Invalid timeMax. Must be RFC3339 datetime.");
    }

    if (minDate >= maxDate) {
      throw new Error("timeMin must be before timeMax");
    }

    if (timeZone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone });
      } catch {
        throw new Error(
          "Invalid timeZone. Use an IANA timezone such as Asia/Kolkata."
        );
      }
    }

    const availability =
      await tenant.googlecalendar.api.calendar.getAvailability({
        timeMin,
        timeMax,
        timeZone,
      });

    return Response.json(availability);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}