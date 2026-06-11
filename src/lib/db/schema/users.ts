import {
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  pgEnum,
  vector,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const priorityEnum = pgEnum("priority", [
  "critical",
  "important",
  "normal",
  "newsletter",
  "low",
  "pending",
]);

export const directionEnum = pgEnum("direction", ["INCOMING", "OUTGOING"]);

export const emailStatusEnum = pgEnum("email_status", [
  "DRAFT",
  "SENT",
  "RECEIVED",
  "FAILED",
]);

export const recipientTypeEnum = pgEnum("recipient_type", ["to", "cc", "bcc"]);

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendeeResponseStatus =
  | "accepted"
  | "declined"
  | "tentative"
  | "needsAction";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Threads ──────────────────────────────────────────────────────────────────

// A thread groups related emails together (mirrors Gmail threading).
// summary / embedding represent the AI-generated understanding of the full thread.
export const threads = pgTable("threads", {
  id: varchar("id", { length: 255 }).primaryKey(), // Gmail threadId
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id)
    .notNull(),

  subject: text("subject"),
  lastMessageAt: timestamp("last_message_at").notNull(),

  // Thread-level state (derived from constituent emails, kept denormalised for perf)
  isRead: boolean("is_read").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  labels: text("labels")
    .array()
    .default(sql`'{}'::text[]`), // e.g. ["INBOX", "IMPORTANT"]
  isTrashed: boolean("is_trashed").default(false).notNull(),
  trashedAt: timestamp("trashed_at"), // nullable — null means not trashed

  // AI fields
  summary: text("summary"),
  embedding: vector("embedding", { dimensions: 1024 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Emails ───────────────────────────────────────────────────────────────────

export const emails = pgTable("emails", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`), // Gmail message ID (falls back to UUID)
  draftId: varchar("draft_id", { length: 255 }),
  threadId: varchar("thread_id", { length: 255 })
    .references(() => threads.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id)
    .notNull(),

  // Direction & lifecycle
  direction: directionEnum("direction").default("INCOMING").notNull(),
  status: emailStatusEnum("email_status").default("RECEIVED").notNull(),
  // Note: isDraft has been removed — use status === "DRAFT" instead

  // Sender
  sender: varchar("sender", { length: 255 }), // "Name <email@example.com>"
  senderEmail: varchar("sender_email", { length: 255 }),

  // Content
  subject: text("subject"),
  bodySnippet: varchar("body_snippet", { length: 500 }),
  rawBody: text("raw_body"),
  htmlBody: text("html_body"),

  // Per-message state
  isRead: boolean("is_read").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),

  isTrashed: boolean("is_trashed").default(false).notNull(),
  trashedAt: timestamp("trashed_at"), // nullable — null means not trashed

  // AI fields
  priority: priorityEnum("priority").default("pending").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),

  // Timestamps
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Email Recipients ─────────────────────────────────────────────────────────

export const emailRecipients = pgTable("email_recipients", {
  id: serial("id").primaryKey(),
  emailId: varchar("email_id", { length: 255 })
    .references(() => emails.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id)
    .notNull(), // denormalised for direct per-user queries
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  type: recipientTypeEnum("type").notNull(), // "to" | "cc" | "bcc"
});

// ─── Calendar Events ──────────────────────────────────────────────────────────

export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

export const calendarEvents = pgTable("calendar_events", {
  // ─── Identity ───────────────────────────────────────────────────────────────
  id: varchar("id", { length: 255 }).primaryKey(), // Google Calendar event ID
  calendarId: varchar("calendar_id", { length: 255 })
    .notNull()
    .default("primary"), // which calendar — users can have multiple (work, personal, etc.)
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id)
    .notNull(), // tenant Id

  // ─── Core ───────────────────────────────────────────────────────────────────
  title: text("title"),
  description: text("description"),
  location: text("location"), // physical address or video link (e.g. Google Meet URL)

  // ─── Time ───────────────────────────────────────────────────────────────────
  startTime: timestamp("start_time", { withTimezone: true }).notNull(), // stored as UTC, withTimezone ensures correct conversion on read
  endTime: timestamp("end_time", { withTimezone: true }).notNull(), // same — always UTC in DB, convert to user's zone on display
  timezone: varchar("timezone", { length: 100 }), // user's timezone at time of creation e.g. "Asia/Kolkata" — needed for checkAvailability to be unambiguous
  isAllDay: boolean("is_all_day").default(false).notNull(), // all-day events store 00:00:00 → 23:59:59 — availability check treats them as blocking the full day

  // ─── Status ─────────────────────────────────────────────────────────────────
  status: calendarEventStatusEnum("status").default("confirmed").notNull(), // cancelled events must be excluded from availability checks

  // ─── Recurrence ─────────────────────────────────────────────────────────────
  recurringEventId: varchar("recurring_event_id", { length: 255 }), // if set, this event is one instance of a recurring series — needed to distinguish "edit this event" vs "edit all"

  // ─── Attendees ──────────────────────────────────────────────────────────────

  attendees: jsonb("attendees").$type<
    {
      email: string;
      responseStatus: AttendeeResponseStatus; 
      displayName?: string;
    }[]
  >(),

  // ─── AI ─────────────────────────────────────────────────────────────────────
  embedding: vector("embedding", { dimensions: 1024 }), // semantic embedding of title + description — used for AI context retrieval (same pattern as emails/threads)

  // ─── Timestamps ─────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
