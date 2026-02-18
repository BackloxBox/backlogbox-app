ALTER TABLE "custom_list_item" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN "started_at" timestamp;--> statement-breakpoint

-- Backfill: in-progress items get started_at = updated_at as best guess
UPDATE "media_item" SET "started_at" = "updated_at" WHERE "status" = 'in_progress';--> statement-breakpoint
UPDATE "custom_list_item" SET "started_at" = "updated_at" WHERE "status" = 'doing';--> statement-breakpoint

-- Backfill: completed items get started_at = created_at
UPDATE "media_item" SET "started_at" = "created_at" WHERE "status" = 'completed' AND "started_at" IS NULL;--> statement-breakpoint
UPDATE "custom_list_item" SET "started_at" = "created_at" WHERE "status" = 'completed' AND "started_at" IS NULL;