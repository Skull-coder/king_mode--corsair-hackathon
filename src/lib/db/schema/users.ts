import { pgTable, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────
//
// The ONLY application table. Gmail is the single source of truth for all
// emails, drafts, threads, and calendar events. We fetch live via Corsair.

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  emailAddress: varchar("email_address", { length: 255 }).notNull().unique(),
  corsairAccessToken: text("corsair_access_token"),
  corsairEntityId: varchar("corsair_entity_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const reminderStatusEnum = pgEnum("reminder_status", [
  "pending",
  "fired",
  "dismissed",
  "replied",
]);

export const reminders = pgTable("reminders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  threadId: text("thread_id").notNull(),
  sentMessageId: text("sent_message_id").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
  remindAfter: timestamp("remind_after", { withTimezone: true }).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject"),
  status: reminderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});