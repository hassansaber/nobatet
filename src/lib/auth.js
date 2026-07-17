import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';

export const SESSION_COOKIE = 'nobatet_session';
const ACTIVE_WORKSPACE_COOKIE = 'nobatet_active_workspace';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '30d';
}

// Lazy db import to avoid circular
async function getDb() {
  const { db } = await import('@/db/index.js');
  return db;
}

/**
 * ساخت payload کامل سشن از دیتابیس
 * شامل globalRoles و memberships
 */
export async function buildSessionPayload(userId) {
  const db = await getDb();
  const { users } = await import('@/db/schema/users.js');
  const { userRoles } = await import('@/db/schema/user-roles.js');
  const { businessMembers, businesses } = await import('@/db/schema/businesses.js');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found for session');

  const globalRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  const globalRoles = globalRows.map((r) => r.role);

  const memberships = await db
    .select({
      businessId: businessMembers.businessId,
      role: businessMembers.role,
      businessSlug: businesses.slug,
      businessName: businesses.name,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(and(eq(businessMembers.userId, userId), eq(businessMembers.isActive, true)));

  // تعیین role قدیمی برای سازگاری backward compat (اولین global یا اولین membership یا role ستون users)
  let legacyRole = 'customer';
  if (globalRoles.includes('super_admin')) legacyRole = 'super_admin';
  else if (globalRoles.includes('visitor')) legacyRole = 'visitor';
  else if (memberships.length > 0) {
    const hasOwner = memberships.find((m) => m.role === 'owner');
    if (hasOwner) legacyRole = 'business_owner';
    else {
      const hasManager = memberships.find((m) => m.role === 'manager');
      if (hasManager) legacyRole = 'business_owner'; // manager هم به business می‌رود
      else legacyRole = 'staff';
    }
  } else {
    legacyRole = user.role || 'customer';
  }

  return {
    sub: user.id,
    phone: user.phone,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    role: legacyRole, // backward compat
    tokenVersion: user.tokenVersion ?? 0,
    globalRoles,
    memberships: memberships.map((m) => ({
      businessId: m.businessId,
      businessSlug: m.businessSlug,
      businessName: m.businessName,
      role: m.role,
    })),
  };
}

/**
 * ساخت JWT و ست کردن کوکی httpOnly
 * ورودی جدید: userId string
 * برای سازگاری قدیمی اگر payload object داده شد، از sub آن استفاده می‌کنیم
 */
export async function createSession(userIdOrPayload) {
  let userId;
  if (typeof userIdOrPayload === 'string') {
    userId = userIdOrPayload;
  } else if (userIdOrPayload && typeof userIdOrPayload === 'object') {
    if (userIdOrPayload.sub) {
      userId = String(userIdOrPayload.sub);
    } else if (userIdOrPayload.id) {
      userId = String(userIdOrPayload.id);
    } else {
      throw new Error('createSession: invalid payload, expected userId');
    }
  } else {
    throw new Error('createSession: userId required');
  }

  const payload = await buildSessionPayload(userId);

  const token = await new SignJWT({
    phone: payload.phone,
    role: payload.role,
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
    tokenVersion: payload.tokenVersion,
    globalRoles: payload.globalRoles,
    memberships: payload.memberships,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(getExpiresIn())
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return token;
}

/**
 * خواندن و verify نشست فعلی با چک tokenVersion و رفرش خاموش
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const sub = String(payload.sub);
    const tokenVersionInJwt = payload.tokenVersion ?? 0;

    // چک ارزان tokenVersion از DB
    try {
      const db = await getDb();
      const { users } = await import('@/db/schema/users.js');
      const [current] = await db.select({ tv: users.tokenVersion }).from(users).where(eq(users.id, sub)).limit(1);
      if (!current) return null;

      if ((current.tv ?? 0) !== tokenVersionInJwt) {
        // نقش عوض شده → سشن را بی‌صدا رفرش کن
        const freshPayload = await buildSessionPayload(sub);
        const newToken = await new SignJWT({
          phone: freshPayload.phone,
          role: freshPayload.role,
          firstName: freshPayload.firstName ?? null,
          lastName: freshPayload.lastName ?? null,
          tokenVersion: freshPayload.tokenVersion,
          globalRoles: freshPayload.globalRoles,
          memberships: freshPayload.memberships,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(freshPayload.sub)
          .setIssuedAt()
          .setExpirationTime(getExpiresIn())
          .sign(getJwtSecret());

        cookieStore.set(SESSION_COOKIE, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });

        return {
          sub: freshPayload.sub,
          phone: freshPayload.phone,
          role: freshPayload.role,
          firstName: freshPayload.firstName,
          lastName: freshPayload.lastName,
          tokenVersion: freshPayload.tokenVersion,
          globalRoles: freshPayload.globalRoles,
          memberships: freshPayload.memberships,
          exp: payload.exp,
        };
      }
    } catch (e) {
      // اگر DB در دسترس نبود، با payload فعلی ادامه بده (edge case)
      console.warn('[getSession] tokenVersion check failed', e?.message);
    }

    return {
      sub: String(payload.sub),
      phone: String(payload.phone ?? ''),
      role: String(payload.role ?? 'customer'),
      firstName: payload.firstName ? String(payload.firstName) : undefined,
      lastName: payload.lastName ? String(payload.lastName) : undefined,
      tokenVersion: payload.tokenVersion ?? 0,
      globalRoles: Array.isArray(payload.globalRoles) ? payload.globalRoles : [],
      memberships: Array.isArray(payload.memberships) ? payload.memberships : [],
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Verify JWT خام (برای Proxy که cookies() ندارد) - بدون DB check
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub: String(payload.sub),
      phone: String(payload.phone ?? ''),
      role: String(payload.role ?? 'customer'),
      firstName: payload.firstName ? String(payload.firstName) : undefined,
      lastName: payload.lastName ? String(payload.lastName) : undefined,
      tokenVersion: payload.tokenVersion ?? 0,
      globalRoles: Array.isArray(payload.globalRoles) ? payload.globalRoles : [],
      memberships: Array.isArray(payload.memberships) ? payload.memberships : [],
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  // پاک کردن active workspace هم
  try {
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {}
}

export async function incrementTokenVersion(userId) {
  try {
    const db = await getDb();
    const { users } = await import('@/db/schema/users.js');
    await db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (e) {
    console.warn('[incrementTokenVersion]', e?.message);
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * مسیر داشبورد بر اساس نقش قدیمی (برای سازگاری)
 */
export function dashboardPathForRole(role) {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'visitor':
      return '/visitor';
    case 'business_owner':
      return '/business';
    case 'staff':
      return '/staff';
    case 'customer':
    default:
      return '/me';
  }
}

/**
 * مسیر هوشمند بر اساس سشن جدید
 */
export function dashboardPathForSession(session) {
  if (!session) return '/login';
  if (session.globalRoles?.includes('super_admin')) return '/admin';
  if (session.memberships?.length > 0) {
    // اگر فقط یک membership دارد مستقیم برو
    if (session.memberships.length === 1) {
      const m = session.memberships[0];
      if (['owner', 'manager'].includes(m.role)) return '/business';
      return '/staff';
    }
    // چندتا دارد → صفحه انتخاب
    return '/choose-workspace';
  }
  if (session.globalRoles?.includes('visitor')) return '/visitor';
  return '/me';
}

export function hasRole(role, allowed) {
  return allowed.includes(role);
}

export function hasGlobalRole(session, role) {
  return session?.globalRoles?.includes(role) || false;
}

export function hasBusinessRole(session, businessId, allowedRoles) {
  if (session?.globalRoles?.includes('super_admin')) return true;
  const m = session?.memberships?.find((mm) => mm.businessId === businessId);
  if (!m) return false;
  if (!allowedRoles) return true;
  return allowedRoles.includes(m.role);
}
