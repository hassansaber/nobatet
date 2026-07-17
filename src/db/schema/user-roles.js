import { pgTable, uuid, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const globalRoleEnum = pgEnum('global_role', ['super_admin', 'visitor']);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: globalRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('user_roles_unique').on(t.userId, t.role)]
);
