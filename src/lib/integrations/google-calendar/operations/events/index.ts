import { db } from "@/lib/db";
import { corsair } from "@/../corsair";
import { calendarEvents } from "@/lib/db/schema";
import { eq, and, ne, lt, gt } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embeddings";
import * as eventSchema from "./model";

export async function createEvents(
  tenantId: string,
  payload: eventSchema.CreateEventInput,
) {
  try {
    const {
      calendarId,
      title,
      description,
      isAllDay,
      start,
      end,
      attendees,
      maxAttendees,
      sendNotifications,
      location,
    } = await eventSchema.createEventInputModel.parseAsync(payload);

    const tenant = corsair.withTenant(tenantId);

    const createEventsApiResponse = await tenant.googlecalendar.api.events.create({
      calendarId,
      maxAttendees,
      sendNotifications,
      event: {
        summary: title,
        description,
        start,
        end,
        attendees,
        location,
      },
    });

    const recurringEventId = createEventsApiResponse.recurringEventId;
    const eventId = createEventsApiResponse.id;

    // ── Parse date-times ──────────────────────────────────────────
    const startTime = start.dateTime
      ? new Date(start.dateTime)
      : new Date(start.date);
    const endTime = end.dateTime
      ? new Date(end.dateTime)
      : new Date(end.date);
    const timezone = start.timeZone || null;

    // ── Generate embedding ────────────────────────────────────────
    const embeddingText = [title, description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(embeddingText);

    // ── Map attendees to DB shape ─────────────────────────────────
    const dbAttendees =
      attendees && attendees.length > 0
        ? attendees.map((a) => ({
            email: a.email || "",
            responseStatus: (a.responseStatus || "needsAction") as
              | "needsAction"
              | "declined"
              | "tentative"
              | "accepted",
            displayName: a.displayName || undefined,
          }))
        : null;

    // ── Insert into calendarEvents ────────────────────────────────
    await db.insert(calendarEvents).values({
      id: eventId,
      calendarId: calendarId || "primary",
      userId: tenantId,
      title,
      description: description || null,
      location: location || null,
      startTime,
      endTime,
      timezone,
      isAllDay: isAllDay || false,
      status: "confirmed",
      recurringEventId: recurringEventId || null,
      attendees: dbAttendees as typeof calendarEvents.$inferInsert["attendees"],
      embedding,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to create event: ${String(error)}`);
  }
}

export async function deleteEvent(tenantId: string, eventId: string) {
    try {
        const tenant = corsair.withTenant(tenantId);

        await tenant.googlecalendar.api.events.delete({
            id: eventId,
        });

        // Delete from our database (scoped to tenant)
        await db
            .delete(calendarEvents)
            .where(
                and(
                    eq(calendarEvents.id, eventId),
                    eq(calendarEvents.userId, tenantId),
                ),
            );
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to delete event: ${String(error)}`);
    }
}

export async function getEvent(tenantId: string, eventId: string) {
    try {
        if (!eventId) {
            throw new Error("eventId is required");
        }

        const event = await db.query.calendarEvents.findFirst({
            where: and(
                eq(calendarEvents.id, eventId),
                eq(calendarEvents.userId, tenantId),
            ),
        });

        if (!event) {
            throw new Error(`Event ${eventId} not found for tenant ${tenantId}`);
        }

        return event;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to fetch event: ${String(error)}`);
    }
}

export async function listEvents(tenantId: string) {
    try {
        const events = await db.query.calendarEvents.findMany({
            where: and(
                eq(calendarEvents.userId, tenantId),
                ne(calendarEvents.status, "cancelled"),
            ),
            orderBy: [calendarEvents.startTime],
        });

        return events;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to list events: ${String(error)}`);
    }
}

export async function updateEvents(
    tenantId: string,
    eventId: string,
    payload: eventSchema.UpdateEventInput,
) {
    try {
        const parsed = await eventSchema.updateEventInputModel.parseAsync(payload);
        const { calendarId, title, description, isAllDay, start, end, attendees, location, status } = parsed;

        // ── 1. Fetch current state FIRST (before touching Google) ──────
        const currentEvent = await db.query.calendarEvents.findFirst({
            where: and(
                eq(calendarEvents.id, eventId),
                eq(calendarEvents.userId, tenantId),
            ),
            columns: { title: true, description: true },
        });

        if (!currentEvent) {
            throw new Error(`Event ${eventId} not found for tenant ${tenantId}`);
        }

        // ── 2. Build API update payload dynamically ────────────────────
        const tenant = corsair.withTenant(tenantId);

        const eventPayload: Record<string, unknown> = {};
        if (title !== undefined) eventPayload.summary = title;
        if (description !== undefined) eventPayload.description = description;
        if (start !== undefined) eventPayload.start = start;
        if (end !== undefined) eventPayload.end = end;
        if (attendees !== undefined) eventPayload.attendees = attendees;
        if (location !== undefined) eventPayload.location = location;
        if (status !== undefined) eventPayload.status = status;

        await tenant.googlecalendar.api.events.update({
            calendarId: calendarId || "primary",
            id: eventId,
            event: eventPayload,
        });

        // ── 3. Build DB update payload dynamically ─────────────────────
        const dbUpdate: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (calendarId !== undefined) dbUpdate.calendarId = calendarId;
        if (title !== undefined) dbUpdate.title = title;
        if (description !== undefined) dbUpdate.description = description;
        if (location !== undefined) dbUpdate.location = location;
        if (isAllDay !== undefined) dbUpdate.isAllDay = isAllDay;
        if (status !== undefined) dbUpdate.status = status;

        if (start !== undefined) {
            dbUpdate.startTime = start.dateTime
                ? new Date(start.dateTime)
                : new Date(start.date);
            dbUpdate.timezone = start.timeZone;
        }
        if (end !== undefined) {
            dbUpdate.endTime = end.dateTime
                ? new Date(end.dateTime)
                : new Date(end.date);
        }

        if (attendees !== undefined) {
            dbUpdate.attendees =
                attendees.length > 0
                    ? attendees.map((a) => ({
                          email: a.email || "",
                          responseStatus: (a.responseStatus || "needsAction") as
                              | "needsAction"
                              | "declined"
                              | "tentative"
                              | "accepted",
                          displayName: a.displayName || undefined,
                      }))
                    : null;
        }

        // ── 4. Regenerate embedding if title or description changed ────
        if (title !== undefined || description !== undefined) {
            const newTitle = title !== undefined ? title : currentEvent.title;
            const newDescription =
                description !== undefined ? description : currentEvent.description;
            const embeddingText = [newTitle, newDescription]
                .filter(Boolean)
                .join(" ");
            dbUpdate.embedding = await generateEmbedding(embeddingText);
        }

        // ── 5. Execute DB update ───────────────────────────────────────
        await db
            .update(calendarEvents)
            .set(dbUpdate as typeof calendarEvents.$inferInsert)
            .where(
                and(
                    eq(calendarEvents.id, eventId),
                    eq(calendarEvents.userId, tenantId),
                ),
            );
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to update event: ${String(error)}`);
    }
}