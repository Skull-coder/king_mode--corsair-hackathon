import { z } from "zod";

const attendeeSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  organizer: z.boolean().optional(),
  self: z.boolean().optional(),
  resource: z.boolean().optional(),
  optional: z.boolean().optional(),
  responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
  comment: z.string().optional(),
  additionalGuests: z.number().int().min(0).optional(),
});

const dateOrDateTimeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
  dateTime: z.string().optional(),
  timeZone: z.string().optional(),
})
  .refine(
    (val) => (val.date || val.dateTime) && !(val.date && val.dateTime),
    { message: "Provide either 'date' (all-day) or 'dateTime' (timed), not both." }
  );

export const eventCreateSchema = z.object({
  summary: z.string().min(1, "Event summary is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start: dateOrDateTimeSchema,
  end: dateOrDateTimeSchema,
  attendees: z.array(attendeeSchema).optional(),
  recurrence: z.array(z.string()).optional(), // e.g. ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"]
  colorId: z.string().optional(),
  transparency: z.enum(["opaque", "transparent"]).optional(),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  eventType: z.enum(["default", "outOfOffice", "focusTime", "workingLocation"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  reminders: z.object({
    useDefault: z.boolean().optional(),
    overrides: z.array(
      z.object({
        method: z.enum(["email", "popup"]),
        minutes: z.number().int(),
      })
    ).optional(),
  }).optional(),
  guestsCanModify: z.boolean().optional(),
  guestsCanInviteOthers: z.boolean().optional(),
  guestsCanSeeOtherGuests: z.boolean().optional(),
  anyoneCanAddSelf: z.boolean().optional(),
  sequence: z.number().int().optional(),
  originalStartTime: z.object({
    date: z.string().optional(),
    dateTime: z.string().optional(),
    timeZone: z.string().optional(),
  }).optional(),
  recurringEventId: z.string().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// Optional: export the TS type
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;