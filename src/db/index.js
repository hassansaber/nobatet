import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/**
 * کلاینت PostgreSQL + Drizzle — lazy تا build بدون DB نشکند.
 */

const globalForDb = globalThis;

/** @type {import('postgres').Sql | undefined} */
let client;
/** @type {ReturnType<typeof drizzle> | undefined} */
let _db;

function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.__nobatet_pg = client;
  }
  return client;
}

/**
 * @returns {import('drizzle-orm/postgres-js').PostgresJsDatabase<typeof schema>}
 */
export function getDb() {
  if (_db) return _db;
  if (globalForDb.__nobatet_db) {
    _db = globalForDb.__nobatet_db;
    return _db;
  }
  _db = drizzle(getClient(), { schema });
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.__nobatet_db = _db;
  }
  return _db;
}

/**
 * Proxy برای سازگاری: `import { db } from '@/db'` و استفاده مستقیم
 * اتصال فقط در اولین query برقرار می‌شود.
 */
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getDb();
      const value = instance[prop];
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  },
);

export { schema };
export default db;
