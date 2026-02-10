CREATE TABLE "media_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_item_id" uuid NOT NULL REFERENCES "media_item"("id") ON DELETE CASCADE,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "media_note_item_idx" ON "media_note" ("media_item_id");
