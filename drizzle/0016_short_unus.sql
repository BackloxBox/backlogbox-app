ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "interests" text[];--> statement-breakpoint
UPDATE "user" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;