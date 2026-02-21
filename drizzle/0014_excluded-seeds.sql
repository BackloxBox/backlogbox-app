CREATE TABLE "excluded_seed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"media_item_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "excluded_seed_user_id_media_item_id_unique" UNIQUE("user_id","media_item_id")
);
--> statement-breakpoint
ALTER TABLE "excluded_seed" ADD CONSTRAINT "excluded_seed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excluded_seed" ADD CONSTRAINT "excluded_seed_media_item_id_media_item_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "excluded_seed_user_idx" ON "excluded_seed" USING btree ("user_id");