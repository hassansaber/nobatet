import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { businesses, businessMembers } from './businesses.js';

export const serviceTypeEnum = pgEnum('service_type', [
  'individual', // یک نفر در هر slot
  'capacity', // کلاس گروهی با ظرفیت
]);

/**
 * خدمات قابل رزرو هر بیزنس
 */
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  /** مدت خدمت به دقیقه */
  durationMinutes: integer('duration_minutes').notNull(),
  /** بافر بعد از خدمت به دقیقه */
  bufferMinutes: integer('buffer_minutes').notNull().default(0),
  /** قیمت به ریال */
  price: integer('price').notNull().default(0),
  type: serviceTypeEnum('type').notNull().default('individual'),
  /** فقط برای type=capacity */
  capacity: integer('capacity').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * کدام کارمند کدام خدمت را ارائه می‌دهد
 */
export const staffServices = pgTable(
  'staff_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => businessMembers.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('staff_services_unique').on(table.memberId, table.serviceId),
  ],
);

/**
 * ساعات کاری — برای بیزنس یا کارمند خاص
 * dayOfWeek: 0=شنبه ... 6=جمعه (تقویم ایرانی)
 */
export const workingHours = pgTable('working_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  /** null = ساعات کل بیزنس؛ مقدار = ساعات خاص آن عضو */
  memberId: uuid('member_id').references(() => businessMembers.id, {
    onDelete: 'cascade',
  }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(), // "18:00"
  isOff: boolean('is_off').notNull().default(false),
});

/**
 * مرخصی / تعطیلات
 */
export const timeOffs = pgTable('time_offs', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').references(() => businessMembers.id, {
    onDelete: 'cascade',
  }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  reason: varchar('reason', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
