import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq, and, ne, lt, gt } from "drizzle-orm";

export async function getAvailability(tenantId: string, timeMin: string, timeMax: string) {
    try {
        // ── Validate inputs ──────────────────────────────────────────────
        if (!timeMin || !timeMax) {
            throw new Error("timeMin and timeMax are required");
        }

        const minTime = new Date(timeMin);
        const maxTime = new Date(timeMax);

        if (isNaN(minTime.getTime())) {
            throw new Error("timeMin is not a valid date string");
        }

        if (isNaN(maxTime.getTime())) {
            throw new Error("timeMax is not a valid date string");
        }

        if (minTime >= maxTime) {
            throw new Error("timeMin must be strictly earlier than timeMax");
        }

        // ── Fetch overlapping, non-cancelled events ──────────────────────
        // An event overlaps [timeMin, timeMax] when:
        //   event.startTime < timeMax  AND  event.endTime > timeMin
        const busyBlocks = await db.query.calendarEvents.findMany({
            where: and(
                eq(calendarEvents.userId, tenantId),
                ne(calendarEvents.status, "cancelled"),
                lt(calendarEvents.startTime, maxTime),
                gt(calendarEvents.endTime, minTime),
            ),
            columns: {
                id: true,
                title: true,
                description: true,
                location: true,
                startTime: true,
                endTime: true,
                isAllDay: true,
                status: true,
                calendarId: true,
            },
            orderBy: [calendarEvents.startTime],
        });

        return busyBlocks;

    } catch (error) {
        if (error instanceof Error) {
            throw error; // already a meaningful Error — rethrow as-is
        }
        throw new Error(`Failed to fetch availability: ${String(error)}`);
    }
}