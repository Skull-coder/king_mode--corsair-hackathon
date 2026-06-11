import { z } from "zod";

export const createEventInputModel = z.object({
  calendarId: z.string().default("primary").optional(),
  title: z.string(),
  description: z.string().optional(),
  isAllDay: z.boolean().default(false).optional(),
  start: z
    .object({
      date: z.string(),
      dateTime: z.string(),
      timeZone: z.string(),
    }),
  end: z
    .object({
      date: z.string(),
      dateTime: z.string(),
      timeZone: z.string(),
    }),
  attendees: z.array(z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    displayName: z.string().optional(),
    organizer: z.boolean().optional(),
    self: z.boolean().optional(),
    resource: z.boolean().optional(),
    optional: z.boolean().optional(),
    responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
    comment: z.string().optional(),
    additionalGuests: z.number().optional(),
  })).optional(),
  maxAttendees: z.number().default(0).optional(),
  sendNotifications: z.boolean().default(false).optional(),
  location: z.string().optional()
});

export type CreateEventInput = z.infer<typeof createEventInputModel>

export const updateEventInputModel = z.object({
  calendarId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  isAllDay: z.boolean().optional(),
  start: z
    .object({
      date: z.string(),
      dateTime: z.string(),
      timeZone: z.string(),
    })
    .optional(),
  end: z
    .object({
      date: z.string(),
      dateTime: z.string(),
      timeZone: z.string(),
    })
    .optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().optional(),
        displayName: z.string().optional(),
        responseStatus: z
          .enum(["needsAction", "declined", "tentative", "accepted"])
          .optional(),
      })
    )
    .optional(),
  location: z.string().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventInputModel>