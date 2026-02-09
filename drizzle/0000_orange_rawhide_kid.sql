CREATE TYPE "public"."media_status" AS ENUM('wishlist', 'backlog', 'in_progress', 'on_hold', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('book', 'movie', 'series', 'game', 'podcast');--> statement-breakpoint
CREATE TABLE "book_meta" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"author" text,
	"page_count" integer,
	"isbn" text
);
--> statement-breakpoint
CREATE TABLE "game_meta" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"platform" text,
	"genre" text,
	"playtime_minutes" integer,
	"igdb_id" integer
);
--> statement-breakpoint
CREATE TABLE "media_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"cover_url" text,
	"release_year" integer,
	"status" "media_status" DEFAULT 'backlog' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_meta" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"director" text,
	"runtime" integer,
	"tmdb_id" integer
);
--> statement-breakpoint
CREATE TABLE "podcast_meta" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"host" text,
	"total_episodes" integer,
	"current_episode" integer,
	"apple_podcast_id" text
);
--> statement-breakpoint
CREATE TABLE "series_meta" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"total_seasons" integer,
	"current_season" integer,
	"tmdb_id" integer
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_meta" ADD CONSTRAINT "book_meta_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_meta" ADD CONSTRAINT "game_meta_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_item" ADD CONSTRAINT "media_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_meta" ADD CONSTRAINT "movie_meta_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_meta" ADD CONSTRAINT "podcast_meta_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_meta" ADD CONSTRAINT "series_meta_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_item_user_type_status_idx" ON "media_item" USING btree ("user_id","type","status");--> statement-breakpoint
CREATE INDEX "media_item_user_type_status_sort_idx" ON "media_item" USING btree ("user_id","type","status","sort_order");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");