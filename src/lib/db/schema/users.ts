import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────
//
// The ONLY application table. Gmail is the single source of truth for all
// emails, drafts, threads, and calendar events. We fetch live via Corsair.

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  corsairAccessToken: text("corsair_access_token"),
  corsairEntityId: varchar("corsair_entity_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
