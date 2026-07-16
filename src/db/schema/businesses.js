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
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const membershipRoleEnum = pgEnum('membership_role', [
  'owner',
  'manager',
  'staff',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);

/**
 * کسب‌وکار (Tenant) — هر بیزنس ساب‌دامین اختصاصی دارد.
 */
export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    bannerUrl: text('banner_url'),
    phone: varchar('phone', { length: 15 }),
    address: text('address'),
    city: varchar('city', { length: 80 }),
    /** پالت رنگ و تنظیمات ظاهری لندینگ */
    theme: jsonb('theme').$type().default({
      primary: '#0d9488',
      secondary: '#0f766e',
      accent: '#f59e0b',
    }),
    /** فیچرهای فعال لندینگ: gallery, reviews, about, ... */
    landingFeatures: jsonb('landing_features').$type().default({
      gallery: true,
      reviews: true,
      about: true,
      services: true,
    }),
    /** سیاست لغو/تغییر نوبت */
    cancellationPolicy: text('cancellation_policy'),
    /** درصد بیعانه (۰ = کل مبلغ، ۱۰۰ = فقط بیعانه کامل) */
    depositPercent: integer('deposit_percent').notNull().default(100),
    /** شماره کارت برای کارت‌به‌کارت */
    cardNumber: varchar('card_number', { length: 19 }),
    cardHolderName: varchar('card_holder_name', { length: 120 }),
    /** کد معرف ویزیتور در زمان ثبت‌نام */
    referralCode: varchar('referral_code', { length: 32 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('businesses_slug_unique').on(table.slug)],
);

/**
 * عضویت کاربر در بیزنس — برای multi-role واقعی
 * (یک کاربر می‌تواند owner یک بیزنس و staff بیزنس دیگر باشد).
 */
export const businessMembers = pgTable(
  'business_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('staff'),
    /** عنوان شغلی نمایشی */
    jobTitle: varchar('job_title', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('business_members_unique').on(table.businessId, table.userId),
  ],
);

/**
 * پروفایل ویزیتور (بازاریاب) — ساب‌دامین و کد معرف
 */
export const visitors = pgTable(
  'visitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 80 }).notNull(),
    referralCode: varchar('referral_code', { length: 32 }).notNull(),
    bio: text('bio'),
    commissionPercent: integer('commission_percent').notNull().default(20),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('visitors_slug_unique').on(table.slug),
    uniqueIndex('visitors_referral_unique').on(table.referralCode),
  ],
);
