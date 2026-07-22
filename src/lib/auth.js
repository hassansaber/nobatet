import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const SESSION_COOKIE = 'nobatet_session'; // access token 15m
export const REFRESH_COOKIE = 'nobatet_refresh'; // refresh token 7d
export const ACTIVE_WORKSPACE_COOKIE = 'nobatet_active_workspace';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

function getAccessExpiresIn() {
  return process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m';
}

function getRefreshExpiresIn() {
  return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}

function getRawBaseHost() {
  try {
    const raw =
      process.env.NEXT_PUBLIC_BASE_DOMAIN ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ||
      'localhost:3001';
    const hostPart = raw.split('/')[0];
    const host = hostPart.split(':')[0].toLowerCase().trim();
    return host || 'localhost';
  } catch {
    return 'localhost';
  }
}

function isLocalHostBase() {
  const host = getRawBaseHost();
  return (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost')
  );
}

function isLvhMeBase() {
  const host = getRawBaseHost();
  return host === 'lvh.me' || host.endsWith('.lvh.me');
}

/**
 * دامنه کوکی - نسخه جدید ساده شده برای ساب‌دامین تک سطحی
 * مثال: moristyle.nobatet.com => Domain=.nobatet.com
 * دیگر .business وسط نیست
 */
function getCookieDomain() {
  try {
    const host = getRawBaseHost();
    if (isLocalHostBase()) return undefined; // host-only برای localhost
    if (isLvhMeBase()) return '.lvh.me';
    if (host.startsWith('.')) return host;
    const parts = host.split('.');
    if (parts.length > 2) {
      const lastTwo = parts.slice(-2).join('.');
      return `.${lastTwo}`;
    }
    return `.${host}`;
  } catch {
    return undefined;
  }
}

function getCookieOptions(maxAgeSeconds, extra = {}) {
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  const isLocal = !domain;
  const isLvh = isLvhMeBase();

  let base;
  if (isLocal && !isLvh) {
    base = {
      httpOnly: true,
      secure: true, // localhost secure context
      sameSite: 'none',
      path: '/',
      maxAge: maxAgeSeconds,
    };
  } else if (isLvh) {
    base = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      domain,
      maxAge: maxAgeSeconds,
    };
  } else {
    base = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      domain,
      maxAge: maxAgeSeconds,
    };
  }
  return { ...base, ...extra };
}

export function getCookieDomainForClient() {
  return getCookieDomain();
}

export function getBaseHostForClient() {
  return getRawBaseHost();
}

export function isLocalEnv() {
  return isLocalHostBase() && !isLvhMeBase();
}

async function getDb() {
  const { db } = await import('@/db/index.js');
  return db;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateJti() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * ساخت payload کامل از DB
 * نسخه minimal برای JWT: فقط businessId + role بدون نام
 */
export async function buildSessionPayload(userId, minimal = false) {
  const db = await getDb();
  const { users } = await import('@/db/schema/users.js');
  const { userRoles } = await import('@/db/schema/user-roles.js');
  const { businessMembers, businesses } = await import('@/db/schema/businesses.js');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found for session');

  const globalRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
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

  let legacyRole = 'customer';
  if (globalRoles.includes('super_admin')) legacyRole = 'super_admin';
  else if (globalRoles.includes('visitor')) legacyRole = 'visitor';
  else if (memberships.length > 0) {
    const hasOwner = memberships.find((m) => m.role === 'owner');
    if (hasOwner) legacyRole = 'business_owner';
    else {
      const hasManager = memberships.find((m) => m.role === 'manager');
      if (hasManager) legacyRole = 'business_owner';
      else legacyRole = 'staff';
    }
  } else {
    legacyRole = user.role || 'customer';
  }

  // minimal برای JWT: فقط id و نقش
  const minimalMemberships = memberships.map((m) => ({
    businessId: m.businessId,
    role: m.role,
  }));

  return {
    sub: user.id,
    phone: user.phone,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    role: legacyRole,
    tokenVersion: user.tokenVersion ?? 0,
    globalRoles,
    memberships: minimal ? minimalMemberships : memberships.map((m) => ({
      businessId: m.businessId,
      businessSlug: m.businessSlug,
      businessName: m.businessName,
      role: m.role,
    })),
  };
}

/**
 * ساخت Access Token کوتاه مدت (15m)
 */
export async function createAccessToken(payload) {
  return await new SignJWT({
    phone: payload.phone,
    role: payload.role,
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
    tokenVersion: payload.tokenVersion,
    globalRoles: payload.globalRoles,
    // فقط businessId+role برای سبک شدن
    memberships: payload.memberships.map((m) => ({
      businessId: m.businessId || m.businessId,
      role: m.role,
      businessSlug: m.businessSlug, // نگه می‌داریم برای backward compat ولی سبک
    })),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(getAccessExpiresIn())
    .setJti(generateJti())
    .sign(getJwtSecret());
}

/**
 * ساخت Refresh Token بلندمدت (7d) + ذخیره هش در DB
 */
export async function createRefreshTokenRecord(userId, ip, userAgent) {
  const jti = generateJti();
  const token = await new SignJWT({
    typ: 'refresh',
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(getRefreshExpiresIn())
    .setJti(jti)
    .sign(getJwtSecret());

  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

  try {
    const db = await getDb();
    const { refreshTokens } = await import('@/db/schema/auth.js');
    await db.insert(refreshTokens).values({
      userId,
      tokenHash,
      jti,
      ipAddress: ip?.slice(0, 64) || null,
      userAgent: userAgent?.slice(0, 500) || null,
      expiresAt,
    });
  } catch (e) {
    console.warn('[createRefreshTokenRecord] DB failed (maybe table not migrated yet)', e?.message);
  }

  return { token, jti, expiresAt };
}

/**
 * ساخت سشن کامل: access + refresh
 */
export async function createSession(userIdOrPayload) {
  let userId;
  if (typeof userIdOrPayload === 'string') {
    userId = userIdOrPayload;
  } else if (userIdOrPayload && typeof userIdOrPayload === 'object') {
    if (userIdOrPayload.sub) userId = String(userIdOrPayload.sub);
    else if (userIdOrPayload.id) userId = String(userIdOrPayload.id);
    else throw new Error('createSession: invalid payload');
  } else {
    throw new Error('createSession: userId required');
  }

  const payload = await buildSessionPayload(userId, true);
  const accessToken = await createAccessToken(payload);

  // IP و UA برای لاگ
  let ip = null;
  let ua = null;
  try {
    const h = await headers();
    ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
    ua = h.get('user-agent') || null;
  } catch {}

  const { token: refreshToken } = await createRefreshTokenRecord(userId, ip, ua);

  const cookieStore = await cookies();
  const accessOpts = getCookieOptions(15 * 60, { path: '/' }); // 15m
  const refreshOpts = getCookieOptions(7 * 24 * 60 * 60, { path: '/', }); // 7d, path=/ برای اینکه در همه جا فرستاده شود (یا /api/auth/refresh)

  // ست access
  cookieStore.set(SESSION_COOKIE, accessToken, accessOpts);
  // fallback lax برای localhost
  if (!accessOpts.domain) {
    try {
      cookieStore.set(SESSION_COOKIE, accessToken, { ...accessOpts, sameSite: 'lax', secure: false });
    } catch {}
  }

  // ست refresh
  cookieStore.set(REFRESH_COOKIE, refreshToken, { ...refreshOpts, path: '/' });
  if (!refreshOpts.domain) {
    try {
      cookieStore.set(REFRESH_COOKIE, refreshToken, { ...refreshOpts, sameSite: 'lax', secure: false, path: '/' });
    } catch {}
  }

  // لاگ تلاش موفق
  try {
    const db = await getDb();
    const { loginAttempts } = await import('@/db/schema/auth.js');
    await db.insert(loginAttempts).values({
      userId,
      phone: payload.phone,
      success: true,
      method: 'otp',
      ipAddress: ip?.slice(0, 64) || null,
      userAgent: ua?.slice(0, 500) || null,
    });
  } catch {}

  return accessToken;
}

/**
 * تلاش برای رفرش با استفاده از refresh cookie
 */
export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    const { payload } = await jwtVerify(refreshToken, getJwtSecret());
    if (payload.typ !== 'refresh') return null;

    const sub = String(payload.sub);
    const jti = String(payload.jti);

    // چک DB که revoke نشده
    try {
      const db = await getDb();
      const { refreshTokens } = await import('@/db/schema/auth.js');
      const { eq: eq2 } = await import('drizzle-orm');
      const tokenHash = hashToken(refreshToken);
      const [record] = await db.select().from(refreshTokens).where(eq2(refreshTokens.tokenHash, tokenHash)).limit(1);
      if (record) {
        if (record.isRevoked) {
          console.warn('[refreshSession] token revoked, possible reuse attack', jti);
          // اگر reuse تشخیص داده شد، تمام refresh token های کاربر را revoke کن (security best practice)
          await db.update(refreshTokens).set({ isRevoked: true, revokedAt: new Date() }).where(eq2(refreshTokens.userId, sub));
          return null;
        }
        if (new Date(record.expiresAt) < new Date()) return null;
      }
    } catch (e) {
      console.warn('[refreshSession] DB check failed, continuing with JWT only', e?.message);
    }

    // چک tokenVersion
    const db = await getDb();
    const { users } = await import('@/db/schema/users.js');
    const [current] = await db.select({ tv: users.tokenVersion }).from(users).where(eq(users.id, sub)).limit(1);
    if (!current) return null;
    if ((current.tv ?? 0) !== (payload.tokenVersion ?? 0) && payload.tokenVersion !== undefined) {
      // اگر tokenVersion داخل refresh هم باشد، چک کن (برای سادگی refresh tokenVersion ندارد، پس این چک را رد می‌کنیم)
    }

    // ساخت payload جدید
    const freshPayload = await buildSessionPayload(sub, true);
    const newAccessToken = await createAccessToken(freshPayload);

    // Rotation: refresh قدیمی را revoke و جدید بساز
    try {
      const db2 = await getDb();
      const { refreshTokens } = await import('@/db/schema/auth.js');
      const { eq: eq3 } = await import('drizzle-orm');
      const oldHash = hashToken(refreshToken);
      
      let ip = null;
      let ua = null;
      try {
        const h = await headers();
        ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
        ua = h.get('user-agent') || null;
      } catch {}

      const { token: newRefreshToken, jti: newJti } = await createRefreshTokenRecord(sub, ip, ua);

      // revoke قدیمی و لینک به جدید
      const { refreshTokens: rtTable } = await import('@/db/schema/auth.js');
      // پیدا کن رکورد قدیمی برای گرفتن id
      const [oldRecord] = await db2.select().from(rtTable).where(eq3(rtTable.tokenHash, oldHash)).limit(1);
      if (oldRecord) {
        await db2.update(rtTable).set({ isRevoked: true, revokedAt: new Date() }).where(eq3(rtTable.id, oldRecord.id));
        // آپدیت replacedBy اگر ستون وجود دارد (اختیاری)
        try {
          const [newRecord] = await db2.select().from(rtTable).where(eq3(rtTable.tokenHash, hashToken(newRefreshToken))).limit(1);
          if (newRecord) {
            await db2.update(rtTable).set({ replacedByTokenId: newRecord.id }).where(eq3(rtTable.id, oldRecord.id));
          }
        } catch {}
      }

      // ست کوکی‌های جدید
      const accessOpts = getCookieOptions(15 * 60, { path: '/' });
      const refreshOpts = getCookieOptions(7 * 24 * 60 * 60, { path: '/' });
      cookieStore.set(SESSION_COOKIE, newAccessToken, accessOpts);
      cookieStore.set(REFRESH_COOKIE, newRefreshToken, { ...refreshOpts, path: '/' });
      if (!accessOpts.domain) {
        try {
          cookieStore.set(SESSION_COOKIE, newAccessToken, { ...accessOpts, sameSite: 'lax', secure: false });
          cookieStore.set(REFRESH_COOKIE, newRefreshToken, { ...refreshOpts, sameSite: 'lax', secure: false, path: '/' });
        } catch {}
      }

      return {
        sub: freshPayload.sub,
        phone: freshPayload.phone,
        role: freshPayload.role,
        firstName: freshPayload.firstName,
        lastName: freshPayload.lastName,
        tokenVersion: freshPayload.tokenVersion,
        globalRoles: freshPayload.globalRoles,
        memberships: freshPayload.memberships,
      };
    } catch (e) {
      console.warn('[refreshSession] rotation failed', e?.message);
      // حداقل access را برگردان
      const accessOpts = getCookieOptions(15 * 60, { path: '/' });
      cookieStore.set(SESSION_COOKIE, newAccessToken, accessOpts);
      return {
        sub: freshPayload.sub,
        phone: freshPayload.phone,
        role: freshPayload.role,
        firstName: freshPayload.firstName,
        lastName: freshPayload.lastName,
        tokenVersion: freshPayload.tokenVersion,
        globalRoles: freshPayload.globalRoles,
        memberships: freshPayload.memberships,
      };
    }
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    // سعی کن با refresh بساز
    try {
      const refreshed = await refreshSession();
      if (refreshed) return refreshed;
    } catch {}
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = String(payload.sub);
    const tokenVersionInJwt = payload.tokenVersion ?? 0;

    try {
      const db = await getDb();
      const { users } = await import('@/db/schema/users.js');
      const [current] = await db.select({ tv: users.tokenVersion }).from(users).where(eq(users.id, sub)).limit(1);
      if (!current) return null;

      if ((current.tv ?? 0) !== tokenVersionInJwt) {
        const freshPayload = await buildSessionPayload(sub, true);
        const newToken = await createAccessToken(freshPayload);
        const cookieOpts = getCookieOptions(15 * 60, { path: '/' });
        cookieStore.set(SESSION_COOKIE, newToken, cookieOpts);
        if (!cookieOpts.domain) {
          try {
            cookieStore.set(SESSION_COOKIE, newToken, { ...cookieOpts, sameSite: 'lax', secure: false });
          } catch {}
        }
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
  } catch (e) {
    // access expired -> try refresh
    if (e?.code === 'ERR_JWT_EXPIRED') {
      try {
        const refreshed = await refreshSession();
        if (refreshed) return refreshed;
      } catch {}
    }
    return null;
  }
}

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
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';

  // revoke تمام refresh token های کاربر
  try {
    const session = await getSession().catch(() => null);
    // session را از access نگیر چون ممکن است پاک شده باشد، از refresh بگیر
    let userId = session?.sub;
    if (!userId) {
      const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
      if (refreshToken) {
        try {
          const { payload } = await jwtVerify(refreshToken, getJwtSecret());
          userId = String(payload.sub);
        } catch {}
      }
    }
    if (userId) {
      const db = await getDb();
      const { refreshTokens } = await import('@/db/schema/auth.js');
      const { eq: eq2 } = await import('drizzle-orm');
      await db.update(refreshTokens).set({ isRevoked: true, revokedAt: new Date() }).where(eq2(refreshTokens.userId, userId));
    }
  } catch (e) {
    console.warn('[destroySession] revoke refresh failed', e?.message);
  }

  const candidatesAccess = [];
  const candidatesRefresh = [];

  const baseAccess = getCookieOptions(0, { path: '/' });
  const baseRefresh = getCookieOptions(0, { path: '/' });

  candidatesAccess.push(baseAccess);
  candidatesRefresh.push(baseRefresh);

  candidatesAccess.push({ httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  candidatesRefresh.push({ httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });

  candidatesAccess.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });
  candidatesRefresh.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });

  if (domain) {
    candidatesAccess.push({ httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', domain, maxAge: 0 });
    candidatesRefresh.push({ httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', domain, maxAge: 0 });
    candidatesAccess.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', domain, maxAge: 0 });
    candidatesRefresh.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', domain, maxAge: 0 });
    candidatesAccess.push({ httpOnly: true, secure: false, sameSite: 'lax', path: '/', domain, maxAge: 0 });
    candidatesRefresh.push({ httpOnly: true, secure: false, sameSite: 'lax', path: '/', domain, maxAge: 0 });
  }

  candidatesAccess.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', domain: 'localhost', maxAge: 0 });
  candidatesRefresh.push({ httpOnly: true, secure: true, sameSite: 'none', path: '/', domain: 'localhost', maxAge: 0 });
  candidatesAccess.push({ httpOnly: true, secure: false, sameSite: 'lax', path: '/', domain: 'localhost', maxAge: 0 });
  candidatesRefresh.push({ httpOnly: true, secure: false, sameSite: 'lax', path: '/', domain: 'localhost', maxAge: 0 });

  for (const opts of candidatesAccess) {
    try { cookieStore.set(SESSION_COOKIE, '', { ...opts, maxAge: 0 }); } catch {}
  }
  for (const opts of candidatesRefresh) {
    try { cookieStore.set(REFRESH_COOKIE, '', { ...opts, maxAge: 0 }); } catch {}
  }

  const activeCandidates = [
    { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0, ...(domain ? { domain } : {}) },
    { httpOnly: false, secure: false, sameSite: 'lax', path: '/', maxAge: 0 },
    { httpOnly: false, secure: true, sameSite: 'none', path: '/', maxAge: 0 },
    { httpOnly: false, secure: true, sameSite: 'none', path: '/', maxAge: 0, domain: 'localhost' },
  ];
  for (const opts of activeCandidates) {
    try { cookieStore.set(ACTIVE_WORKSPACE_COOKIE, '', opts); } catch {}
  }
}

export async function incrementTokenVersion(userId) {
  try {
    const db = await getDb();
    const { users } = await import('@/db/schema/users.js');
    await db.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() }).where(eq(users.id, userId));
    // همچنین تمام refresh token ها را revoke کن تا کاربر مجبور به رفرش شود
    try {
      const { refreshTokens } = await import('@/db/schema/auth.js');
      await db.update(refreshTokens).set({ isRevoked: true, revokedAt: new Date() }).where(eq(refreshTokens.userId, userId));
    } catch {}
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

export function dashboardPathForRole(role) {
  switch (role) {
    case 'super_admin': return '/admin';
    case 'visitor': return '/visitor';
    case 'business_owner': return '/business';
    case 'staff': return '/staff';
    default: return '/me';
  }
}

export function dashboardPathForSession(session) {
  if (!session) return '/login';
  const globalCount = (session.globalRoles || []).length;
  const membershipCount = (session.memberships || []).length;
  const total = globalCount + membershipCount;
  if (total > 1) return '/choose-workspace';
  if (session.globalRoles?.includes('super_admin')) return '/admin';
  if (session.globalRoles?.includes('visitor')) return '/visitor';
  if (membershipCount === 1) {
    const m = session.memberships[0];
    if (['owner', 'manager'].includes(m.role)) return '/business';
    return '/staff';
  }
  if (session.role === 'business_owner') return '/business';
  if (session.role === 'staff') return '/staff';
  if (session.role === 'visitor') return '/visitor';
  if (session.role === 'super_admin') return '/admin';
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
