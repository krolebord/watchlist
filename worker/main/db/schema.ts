import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

const now = sql`(current_timestamp)`;

export const usersTable = sqliteTable('users', (x) => ({
  id: x.text().primaryKey(),
  name: x.text().notNull(),
  email: x.text().notNull(),

  createdAt: x.integer({ mode: 'timestamp' }).notNull().default(now),
  updatedAt: x
    .integer({ mode: 'timestamp' })
    .notNull()
    .default(now)
    .$onUpdate(() => new Date()),
}));

export const verificationsTable = sqliteTable('verifications', (x) => ({
  id: x.text('id').primaryKey(),

  targetType: x.text().notNull(),
  target: x.text().notNull(),
  token: x.text().notNull().unique(),

  createdAt: x.integer({ mode: 'timestamp' }).notNull().default(now),
  expiredAt: x.integer({ mode: 'timestamp' }).notNull(),
  usedAt: x.integer({ mode: 'timestamp' }),
  isValid: x.integer({ mode: 'boolean' }).notNull().default(true),
}));
