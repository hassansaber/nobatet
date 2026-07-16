import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { businesses } from './businesses.js';
import { users } from './users.js';

export const customerTierEnum = pgEnum('customer_tier', [
  'normal',
  'silver',
  'gold',
  'vip',
]);

/**
 * پروفایل CRM مشتری در سطح هر بیزنس (بر اساس موبایل)
 */
export const customerProfiles = pgTable(
  'customer_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 11 }).notNull(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    displayName: varchar('display_name', { length: 160 }),
    notes: text('notes'),
    /** تگ‌ها: ["وفادار","حساس"] */
    tags: jsonb('tags').$type().default([]),
    tier: customerTierEnum('tier').notNull().default('normal'),
    loyaltyPoints: integer('loyalty_points').notNull().default(0),
    /** کد معرف اختصاصی مشتری (رفرال) */
    referralCode: varchar('referral_code', { length: 16 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('customer_profiles_biz_phone').on(
      table.businessId,
      table.phone,
    ),
    index('customer_profiles_biz_tier').on(table.businessId, table.tier),
  ],
);

/**
 * تنظیمات باشگاه مشتریان هر بیزنس
 */
export const loyaltySettings = pgTable(
  'loyalty_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(true),
    /** امتیاز به ازای هر ۱۰۰۰ تومان پرداخت‌شده */
    pointsPerThousand: integer('points_per_thousand').notNull().default(1),
    /** حداقل امتیاز برای استفاده */
    minRedeemPoints: integer('min_redeem_points').notNull().default(100),
    /** ارزش هر امتیاز به تومان هنگام استفاده */
    pointValueToman: integer('point_value_toman').notNull().default(100),
    welcomePoints: integer('welcome_points').notNull().default(50),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('loyalty_settings_biz_unique').on(table.businessId),
  ],
);

/**
 * تاریخچه امتیاز باشگاه
 */
export const loyaltyLedger = pgTable(
  'loyalty_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'cascade' }),
    /** earn | redeem | adjust | welcome */
    type: varchar('type', { length: 20 }).notNull(),
    points: integer('points').notNull(),
    note: varchar('note', { length: 240 }),
    bookingId: uuid('booking_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('loyalty_ledger_profile_idx').on(table.profileId),
  ],
);

/**
 * کد تخفیف
 */
export const discountCodes = pgTable(
  'discount_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    /** percent | fixed */
    type: varchar('type', { length: 16 }).notNull().default('percent'),
    value: integer('value').notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    note: varchar('note', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discount_codes_biz_code').on(table.businessId, table.code),
  ],
);
