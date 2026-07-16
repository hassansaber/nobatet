import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { businesses, businessMembers } from './businesses.js';
import { services } from './services.js';

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending_payment', // در انتظار پرداخت / تأیید کارت‌به‌کارت
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'expired', // قفل منقضی شده بدون پرداخت
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'gateway',
  'card_to_card',
  'cash', // رزرو حضوری توسط ادمین
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'confirmed',
  'rejected',
  'failed',
  'refunded',
]);

/**
 * رزروها — قلب سیستم
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    /** کارمند ارائه‌دهنده؛ null = بدون ترجیح / تخصیص بعدی */
    memberId: uuid('member_id').references(() => businessMembers.id, {
      onDelete: 'set null',
    }),
    customerId: uuid('customer_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    customerName: varchar('customer_name', { length: 160 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 11 }).notNull(),
    /** شروع slot (UTC) */
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    /** پایان خدمت (بدون buffer) */
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: bookingStatusEnum('status').notNull().default('pending_payment'),
    /** قفل موقت تا این زمان (برای جلوگیری از double-book) */
    lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    /** مشتری قوانین لغو را تأیید کرده */
    policyAccepted: boolean('policy_accepted').notNull().default(false),
    totalAmount: integer('total_amount').notNull().default(0),
    depositAmount: integer('deposit_amount').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bookings_business_starts_idx').on(table.businessId, table.startsAt),
    index('bookings_member_starts_idx').on(table.memberId, table.startsAt),
    index('bookings_customer_idx').on(table.customerId),
    index('bookings_status_lock_idx').on(table.status, table.lockExpiresAt),
  ],
);

/**
 * پرداخت‌ها — gateway یا card_to_card
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amount: integer('amount').notNull(),
    /** شناسه تراکنش درگاه */
    gatewayRef: varchar('gateway_ref', { length: 120 }),
    /** ۴ رقم آخر کارت مبدأ (کارت‌به‌کارت) */
    sourceCardLast4: varchar('source_card_last4', { length: 4 }),
    /** زمان اعلام‌شده واریز توسط مشتری */
    transferReportedAt: timestamp('transfer_reported_at', { withTimezone: true }),
    receiptImageUrl: text('receipt_image_url'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('payments_booking_idx').on(table.bookingId)],
);
