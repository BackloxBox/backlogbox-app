ALTER TABLE "media_item" ADD COLUMN "completed_at" timestamp;
--> statement-breakpoint
UPDATE "media_item" SET "completed_at" = "updated_at" WHERE "status" = 'completed';