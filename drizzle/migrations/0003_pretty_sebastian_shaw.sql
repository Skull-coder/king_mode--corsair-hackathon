ALTER TABLE "email_recipients" DROP CONSTRAINT "email_recipients_email_id_emails_id_fk";
--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;