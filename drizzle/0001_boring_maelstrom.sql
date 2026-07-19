CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "match_feedback" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_preferences" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "match_feedback" CASCADE;--> statement-breakpoint
DROP TABLE "user_preferences" CASCADE;--> statement-breakpoint
-- Old "embedding" column was a 512-dim real[] (FashionCLIP) from a removed feature; incompatible
-- with the new 1536-dim vector column, and its data was confirmed disposable before dropping.
ALTER TABLE "wardrobe_items" DROP COLUMN "embedding";--> statement-breakpoint
-- 1536 dimensions matches OpenAI's text-embedding-3-small output size; the column is intended
-- for embeddings produced by that model specifically, not a general-purpose vector store.
ALTER TABLE "wardrobe_items" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
COMMENT ON COLUMN "wardrobe_items"."embedding" IS 'Embedding vector from OpenAI text-embedding-3-small (1536 dimensions).';--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD COLUMN "processing_status" text DEFAULT 'not_requested';--> statement-breakpoint
CREATE INDEX "wardrobe_items_embedding_hnsw_idx" ON "wardrobe_items" USING hnsw ("embedding" vector_cosine_ops);