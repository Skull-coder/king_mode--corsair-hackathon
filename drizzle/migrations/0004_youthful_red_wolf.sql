ALTER TABLE "emails" DROP CONSTRAINT "emails_thread_id_threads_id_fk";
--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;