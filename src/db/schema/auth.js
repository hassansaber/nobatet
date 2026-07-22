import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * رفرش توکن‌ها برای پیاده‌سازی short-lived access + long-lived refresh با rotation
 * مطابق best practice: https://www.javacodegeeks.com/2024/12/managing-jwt-refresh-tokens-in-spring-security-a-complete-guide.html
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // هش شده token (sha256) - خود توکن خام را ذخیره نمی‌کنیم
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  // jti برای tracking
  jti: varchar('jti', { length: 64 }).notNull().unique(),
  // آیا revoke شده؟
  isRevoked: boolean('is_revoked').notNull().default(false),
  // اگر rotate شده، به کدام توکن جدید اشاره می‌کند
  replacedByTokenId: uuid('replaced_by_token_id'),
  // IP و UserAgent برای تشخیص سرقت
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('refresh_tokens_user_id_idx').on(table.userId),
  index('refresh_tokens_expires_at_idx').on(table.expiresAt),
]);

/**
 * لاگ تلاش‌های لاگین برای audit و تشخیص نفوذ
 */
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 11 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  success: boolean('success').notNull().default(false),
  method: varchar('method', { length: 20 }).notNull().default('otp'), // otp | password | refresh
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('login_attempts_phone_idx').on(table.phone),
  index('login_attempts_user_id_idx').on(table.userId),
]);

/**
 * دعوت‌نامه‌های تیم - برای RBAC پیشرفته
 */
export const businessInvites = pgTable('business_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull(),
  emailOrPhone: varchar('email_or_phone', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('staff'), // owner | manager | staff
  token: varchar('token', { length: 128 }).notNull().unique(),
  invitedByUserId: uuid('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  isAccepted: boolean('is_accepted').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('business_invites_business_id_idx').on(table.businessId),
  index('business_invites_token_idx').on(table.token),
]);
