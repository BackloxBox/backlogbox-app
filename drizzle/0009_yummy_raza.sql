DO $$ BEGIN
  CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'url', 'date');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."custom_list_status" AS ENUM('wishlist', 'planned', 'doing', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_list_user_slug_uniq" UNIQUE("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_list_field" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"name" text NOT NULL,
	"field_type" "custom_field_type" DEFAULT 'text' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_list_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"rating" integer,
	"notes" text,
	"status" "custom_list_status" DEFAULT 'planned' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_list_item_field_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_item_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "developer" text;--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "publisher" text;--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "playing_on" text;--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "critic_score" integer;--> statement-breakpoint
ALTER TABLE "game_meta" ADD COLUMN IF NOT EXISTS "user_score" integer;--> statement-breakpoint
ALTER TABLE "media_item" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "genre" text;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "publisher" text;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "listening_on" text;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "frequency" text;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD COLUMN IF NOT EXISTS "episode_length" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_username" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_list" ADD CONSTRAINT "custom_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_list_field" ADD CONSTRAINT "custom_list_field_list_id_custom_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."custom_list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_list_item" ADD CONSTRAINT "custom_list_item_list_id_custom_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."custom_list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_list_item_field_value" ADD CONSTRAINT "custom_list_item_field_value_item_id_custom_list_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."custom_list_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_list_item_field_value" ADD CONSTRAINT "custom_list_item_field_value_field_id_custom_list_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_list_field"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "media_note" ADD CONSTRAINT "media_note_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_list_user_idx" ON "custom_list" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_list_field_list_idx" ON "custom_list_field" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_list_item_list_status_sort_idx" ON "custom_list_item" USING btree ("list_id","status","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_list_item_field_value_item_idx" ON "custom_list_item_field_value" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_note_item_idx" ON "media_note" USING btree ("media_item_id");
