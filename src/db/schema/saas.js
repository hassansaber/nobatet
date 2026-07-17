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
import { businesses, visitors } from './businesses.js';
import { users } from './users.js';

export const subStatusEnum = pgEnum('saas_sub_status', [
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);

export const invoiceStatusEnum = pgEnum('saas_invoice_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

/**
 * پلن‌های اشتراک SaaS پلتفرم - upgraded for task 7,8
 * 3 tiers: base, pro, enterprise - each with 1m, 3m, 12m pricing
 */
export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 40 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    description: text('description'),
    longDescription: text('long_description'),
    /** قیمت ماهانه تومان */
    priceMonthly: integer('price_monthly').notNull().default(0),
    price3Months: integer('price_3months'),
    /** قیمت سالانه تومان */
    priceYearly: integer('price_yearly'),
    maxStaff: integer('max_staff').notNull().default(1),
    maxServices: integer('max_services').notNull().default(10),
    maxBookingsPerMonth: integer('max_bookings_per_month'), // null = unlimited
    maxSmsPerMonth: integer('max_sms_per_month'), // task 7: limit by sms count
    features: jsonb('features').$type().default({
      crm: false,
      loyalty: false,
      reports: false,
      customTheme: false,
      cardToCard: true,
      gateway: true,
      smsReminders: false,
      customDomain: false,
      expenses: false,
      qrCode: true,
      advancedCharts: false,
    }),
    trialDays: integer('trial_days').notNull().default(14),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    isPublic: boolean('is_public').notNull().default(true),
    tier: varchar('tier', { length: 20 }).notNull().default('base'), // base | pro | enterprise
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('plans_code_unique').on(table.code)],
);

/**
 * اشتراک فعال هر بیزنس
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'restrict' }),
    status: subStatusEnum('status').notNull().default('trial'),
    /** ویزیتوری که این بیزنس را جذب کرده */
    visitorId: uuid('visitor_id').references(() => visitors.id, {
      onDelete: 'set null',
    }),
    startsAt: timestamp('starts_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    /** monthly | yearly */
    billingCycle: varchar('billing_cycle', { length: 16 })
      .notNull()
      .default('monthly'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('subscriptions_business_idx').on(table.businessId),
    index('subscriptions_visitor_idx').on(table.visitorId),
  ],
);

/**
 * فاکتورهای اشتراک
 */
export const subscriptionInvoices = pgTable(
  'subscription_invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    status: invoiceStatusEnum('status').notNull().default('pending'),
    /** gateway sandbox ref */
    gatewayRef: varchar('gateway_ref', { length: 120 }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    note: varchar('note', { length: 240 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('sub_invoices_business_idx').on(table.businessId)],
);

/**
 * کمیسیون ویزیتور از فاکتورهای پرداخت‌شده
 */
export const visitorCommissions = pgTable(
  'visitor_commissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    visitorId: uuid('visitor_id')
      .notNull()
      .references(() => visitors.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => subscriptionInvoices.id, {
      onDelete: 'set null',
    }),
    amount: integer('amount').notNull(),
    percent: integer('percent').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    /** pending | approved | paid */
    note: varchar('note', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('visitor_commissions_visitor_idx').on(table.visitorId)],
);

/**
 * تنظیمات سراسری پلتفرم (super admin)
 */
export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 80 }).notNull().unique(),
  value: jsonb('value').$type().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

/**
 * لاگ پیامک‌ها برای محاسبه مصرف (Task 7)
 */
export const smsLogs = pgTable(
  'sms_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id').references(() => businesses.id, {
      onDelete: 'cascade',
    }),
    phone: varchar('phone', { length: 11 }).notNull(),
    pattern: varchar('pattern', { length: 40 }).notNull(),
    bodyId: varchar('body_id', { length: 40 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // sent | failed | pending
    providerRef: varchar('provider_ref', { length: 120 }),
    cost: integer('cost').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sms_logs_business_idx').on(table.businessId),
    index('sms_logs_created_idx').on(table.createdAt),
  ],
);

/**
 * هزینه کرد / حسابداری کوچک کسب‌وکار (Task 13)
 */
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }).notNull(),
    amount: integer('amount').notNull(),
    category: varchar('category', { length: 40 }).notNull().default('other'), // rent, salary, purchase, marketing, other
    description: text('description'),
    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('expenses_business_idx').on(table.businessId)],
);
