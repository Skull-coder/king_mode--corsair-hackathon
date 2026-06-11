CREATE TYPE "public"."direction" AS ENUM('INCOMING', 'OUTGOING');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('DRAFT', 'SENT', 'RECEIVED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('to', 'cc', 'bcc');--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"type" "recipient_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"subject" text,
	"last_message_at" timestamp NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"labels" text[] DEFAULT '{}'::text[],
	"summary" text,
	"embedding" vector(1024),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corsair_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dek" text
);
--> statement-breakpoint
CREATE TABLE "corsair_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"version" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corsair_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "corsair_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dek" text
);
--> statement-breakpoint
ALTER TABLE "thread_summaries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "thread_summaries" CASCADE;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "priority" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "direction" "direction" DEFAULT 'INCOMING' NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "email_status" "email_status" DEFAULT 'RECEIVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "sender_email" varchar(255);--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "html_body" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_accounts" ADD CONSTRAINT "corsair_accounts_integration_id_corsair_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."corsair_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_entities" ADD CONSTRAINT "corsair_entities_account_id_corsair_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."corsair_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corsair_events" ADD CONSTRAINT "corsair_events_account_id_corsair_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."corsair_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;