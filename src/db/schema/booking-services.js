import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { bookings } from './bookings.js';
import { services } from './services.js';

/**
 * خدمات چندگانه برای یک رزرو - برای انتخاب چند خدمت همزمان
 */
export const bookingServices = pgTable(
  'booking_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('booking_services_unique').on(table.bookingId, table.serviceId)],
);
