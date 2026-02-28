CREATE TABLE "match_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"outfit_photo_hash" text,
	"suggested_item_id" text,
	"base_similarity" real,
	"boosted_similarity" real,
	"confidence" text,
	"user_action" text,
	"metadata" jsonb,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" text PRIMARY KEY NOT NULL,
	"photo_url" text,
	"item_ids" text[] DEFAULT '{}',
	"notes" text,
	"rating" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"category_match_weight" real DEFAULT 1,
	"brand_match_weight" real DEFAULT 1,
	"recency_weight" real DEFAULT 1,
	"wear_frequency_weight" real DEFAULT 1,
	"high_confidence_threshold" real DEFAULT 0.78,
	"medium_confidence_threshold" real DEFAULT 0.68,
	"total_feedback_count" integer DEFAULT 0,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wardrobe_items" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"notes" text,
	"brand" text,
	"category" text NOT NULL,
	"sub_category" text,
	"wear_count" integer DEFAULT 0 NOT NULL,
	"initial_wear_count" integer DEFAULT 0,
	"wear_history" timestamp with time zone[] DEFAULT '{}',
	"price" numeric,
	"is_second_hand" boolean DEFAULT false,
	"is_dog_casual" boolean DEFAULT false,
	"is_handmade" boolean DEFAULT false,
	"rating" smallint,
	"purchase_date" timestamp with time zone,
	"embedding" real[],
	"archived_at" timestamp with time zone,
	"archive_reason" text,
	"archive_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
