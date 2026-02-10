ALTER TABLE "user" ADD COLUMN "subscribed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "free_access" boolean DEFAULT false NOT NULL;