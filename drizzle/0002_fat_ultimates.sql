ALTER TABLE "wardrobe_items" ADD COLUMN "ai_model" text;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "ai_prompt_version" integer;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "ai_processed_at" timestamp with time zone;