import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ========== Wardrobe Items ==========

export const wardrobeItems = pgTable('wardrobe_items', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  notes: text('notes'),
  brand: text('brand'),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  wearCount: integer('wear_count').default(0).notNull(),
  initialWearCount: integer('initial_wear_count').default(0),
  wearHistory: timestamp('wear_history', { withTimezone: true, mode: 'date' })
    .array()
    .default(sql`'{}'`),
  price: numeric('price'),
  isSecondHand: boolean('is_second_hand').default(false),
  isDogCasual: boolean('is_dog_casual').default(false),
  isHandmade: boolean('is_handmade').default(false),
  rating: smallint('rating'), // 1 = good, 0 = meh, -1 = nope
  purchaseDate: timestamp('purchase_date', { withTimezone: true, mode: 'date' }),
  embedding: real('embedding').array(), // 512-dim FashionCLIP vector
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  userId: uuid('user_id').notNull(),
});

// ========== Outfits ==========

export const outfits = pgTable('outfits', {
  id: text('id').primaryKey(),
  photoUrl: text('photo_url'),
  itemIds: text('item_ids').array().default(sql`'{}'`),
  notes: text('notes'),
  rating: smallint('rating'), // 1 = good, 0 = meh, -1 = nope
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  userId: uuid('user_id').notNull(),
});

// ========== AI Match Feedback ==========

export const matchFeedback = pgTable('match_feedback', {
  id: text('id').primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  outfitPhotoHash: text('outfit_photo_hash'),
  suggestedItemId: text('suggested_item_id'),
  baseSimilarity: real('base_similarity'),
  boostedSimilarity: real('boosted_similarity'),
  confidence: text('confidence'), // 'high' | 'medium' | 'low'
  userAction: text('user_action'), // 'accepted' | 'rejected'
  metadata: jsonb('metadata'),
  userId: uuid('user_id').notNull(),
});

// ========== AI User Preferences ==========

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey().default('default'),
  categoryMatchWeight: real('category_match_weight').default(1.0),
  brandMatchWeight: real('brand_match_weight').default(1.0),
  recencyWeight: real('recency_weight').default(1.0),
  wearFrequencyWeight: real('wear_frequency_weight').default(1.0),
  highConfidenceThreshold: real('high_confidence_threshold').default(0.78),
  mediumConfidenceThreshold: real('medium_confidence_threshold').default(0.68),
  totalFeedbackCount: integer('total_feedback_count').default(0),
  lastUpdated: timestamp('last_updated', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1),
  userId: uuid('user_id').notNull(),
});
