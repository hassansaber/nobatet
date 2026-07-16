import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** نقش‌های اصلی کاربر در سطح پلتفرم */
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'visitor',
  'business_owner',
  'staff',
  'customer',
]);

/**
 * جدول کاربران — تک جدول برای همه نقش‌ها.
 * یک شماره موبایل می‌تواند هم‌زمان صاحب بیزنس و مشتری بیزنس دیگری باشد
 * (نقش‌های وابسته به بیزنس از طریق business_members مدیریت می‌شود).
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 11 }).notNull(),
    firstName: varchar('first_name', { length: 80 }),
    lastName: varchar('last_name', { length: 80 }),
    passwordHash: text('password_hash'),
    /** نقش پیش‌فرض / اصلی کاربر در پلتفرم */
    role: userRoleEnum('role').notNull().default('customer'),
    isActive: boolean('is_active').notNull().default(true),
    isPhoneVerified: boolean('is_phone_verified').notNull().default(false),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_phone_unique').on(table.phone)],
);

/**
 * کدهای OTP موقت — برای ورود/ثبت‌نام و فراموشی رمز.
 * بعد از مصرف یا انقضا پاک/غیرفعال می‌شوند.
 */
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 11 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  /** login | register | reset_password */
  purpose: varchar('purpose', { length: 32 }).notNull().default('login'),
  attempts: varchar('attempts', { length: 2 }).notNull().default('0'),
  isUsed: boolean('is_used').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
