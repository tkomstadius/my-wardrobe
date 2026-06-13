import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
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
  archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
  archiveReason: text('archive_reason'), // 'thrown_away' | 'donated' | 'sold'
  archiveNotes: text('archive_notes'),
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

