CREATE TYPE "public"."priority" AS ENUM('critical', 'important', 'normal', 'newsletter', 'low', 'pending');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" text,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"attendees" jsonb,
	"embedding" vector(1024)
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"subject" text,
	"sender" varchar(255),
	"body_snippet" varchar(500),
	"raw_body" text,
	"priority" "priority" DEFAULT 'pending',
	"received_at" timestamp NOT NULL,
	"embedding" vector(1024)
);
--> statement-breakpoint
CREATE TABLE "thread_summaries" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"summary_text" text NOT NULL,
	"embedding" vector(1024)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_summaries" ADD CONSTRAINT "thread_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;