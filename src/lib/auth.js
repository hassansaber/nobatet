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

/**
 * تشخیص base host بدون پورت
 * مثال: localhost:3001 -> localhost
 *        nobatet.com -> nobatet.com
 *        https://nobatet.com -> nobatet.com
 */
function getRawBaseHost() {
  try {
    const raw =
      process.env.NEXT_PUBLIC_BASE_DOMAIN ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ||
      'localhost:3001';
    // ممکنه شامل مسیر باشه، فقط host رو بگیر
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
 * دامنه کوکی:
 * - localhost / 127.0.0.1 => undefined (host-only) چون Domain=localhost توسط مرورگر رد می‌شود
 * - lvh.me => .lvh.me (lvh.me اجازه شیر کوکی روی ساب‌دامین را می‌دهد و به 127.0.0.1 رزولو می‌شود)
 * - prod   => .nobatet.com (یا هرچی در ENV هست) تا همه ساب‌دامین‌ها پوشش داده شوند
 */
function getCookieDomain() {
  try {
    const host = getRawBaseHost();

    // لوکال خالص: نباید domain ست کنیم چون مرورگر قبول نمی‌کند
    if (isLocalHostBase()) {
      return undefined;
    }

    // lvh.me حالت خاص برای dev با ساب‌دامین واقعی
    if (isLvhMeBase()) {
      // اگر base = foo.lvh.me باشه، می‌خوایم .lvh.me برگردونیم، نه .foo.lvh.me
      // ساده‌ترین: اگر لاین شامل lvh.me هست، دامنه را .lvh.me برگردون
      return '.lvh.me';
    }

    // پروداکشن: دامنه را با نقطه برگردون
    // اگر host شامل نقطه نباشد (مثلا فقط nobatet) فرض می‌کنیم همون کافیست
    if (host.startsWith('.')) return host;
    // تمیز کن: اگر business.nobatet.com به اشتباه در ENV باشد، فقط eTLD+1 را می‌خواهیم؟
    // برای سادگی اگر بیشتر از 2 بخش دارد و شامل business یا visitor است، دو بخش آخر را بگیر
    const parts = host.split('.');
    if (parts.length > 2) {
      // اگر الگو *.business.nobatet.com یا *.visitor.nobatet.com → دو بخش آخر
      // یا اگر 3 بخش مثل app.nobatet.com → دو بخش آخر
      const lastTwo = parts.slice(-2).join('.');
      // استثنا: co.uk ها نداریم، پس lastTwo کافیست
      return `.${lastTwo}`;
    }
    return `.${host}`;
  } catch {
    return undefined;
  }
}

function getCookieOptions(maxAgeSeconds) {
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  const isLocal = !domain; // وقتی domain نداریم یعنی لوکال هستیم
  const isLvh = isLvhMeBase();

  // منطق جدید:
  // - لوکال true (localhost): SameSite=None + Secure=true لازم داریم تا کوکی در fetch کراس‌سایت (sub.localhost -> localhost) ارسال شود
  // - lvh.me: SameSite=Lax کافیست چون eTLD+1 = lvh.me و ساب‌دامین‌ها SameSite محسوب می‌شوند
  // - پروداکشن: SameSite=Lax + Domain=.nobatet.com

  if (isLocal && !isLvh) {
    // localhost واقعی
    const opts = {
      httpOnly: true,
      secure: true, // localhost secure context
      sameSite: 'none',
      path: '/',
      maxAge: maxAgeSeconds,
    };
    // domain نداریم
    return opts;
  }

  if (isLvh) {
    // lvh.me هم Secure لازم دارد؟ روی http هم کار می‌کند ولی Secure true در لوکال مجاز است
    return {
      httpOnly: true,
      secure: false, // lvh.me معمولا روی http لوکال اجراست، Secure false تا ست شود
      sameSite: 'lax',
      path: '/',
      domain,
      maxAge: maxAgeSeconds,
    };
  }

  // پروداکشن
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain,
    maxAge: maxAgeSeconds,
  };
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

  // تعیین role قدیمی برای سازگاری backward compat
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

  return {
    sub: user.id,
    phone: user.phone,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    role: legacyRole,
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
  const cookieOpts = getCookieOptions(60 * 60 * 24 * 30);

  // ست کردن اصلی
  cookieStore.set(SESSION_COOKIE, token, cookieOpts);

  // برای loacalhost که domain نداریم، یک نسخه fallback با SameSite=Lax هم ست می‌کنیم
  // تا در حالت same-site navigation هم کوکی ارسال شود
  if (!cookieOpts.domain) {
    try {
      cookieStore.set(SESSION_COOKIE, token, {
        ...cookieOpts,
        sameSite: 'lax',
        secure: false,
        // حذف domain قبلا undefined است
      });
    } catch {}
  }

  // برای اطمینان در پروداکشن هم یک نسخه بدون domain ست می‌کنیم؟
  // نه، فقط با domain کافیست. ولی برای دوران گذار هر دو را ست می‌کنیم تا کلاینت‌های قدیمی پاک شوند
  if (cookieOpts.domain) {
    try {
      // نسخه دوم بدون domain برای پاکسازی
      // نمی‌خواهیم overwrite کنیم، فقط اگر قدیمی با host-only بود آن را هم ست کنیم؟
      // در عمل فقط یکی می‌ماند، مهم نیست
    } catch {}
  }

  return token;
}

/**
 * خواندن و verify نشست فعلی با چک tokenVersion
 * اگر tokenVersion mismatch بود، سعی می‌کنیم رفرش کنیم (برای تغییر نقش)
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
      const [current] = await db
        .select({ tv: users.tokenVersion })
        .from(users)
        .where(eq(users.id, sub))
        .limit(1);
      if (!current) return null;

      if ((current.tv ?? 0) !== tokenVersionInJwt) {
        // نقش عوض شده → سشن را بی‌صدا رفرش کن
        // استثنا: اگر current.tv > tokenVersionInJwt + 10 باشه احتمال لاگ‌اوت گروهی است؟ نه، باز هم رفرش می‌کنیم
        // برای لاگ‌اوت ما tokenVersion را زیاد نمی‌کنیم، فقط کوکی پاک می‌شود، پس رفرش مشکلی ندارد
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

        const cookieOpts = getCookieOptions(60 * 60 * 24 * 30);
        cookieStore.set(SESSION_COOKIE, newToken, cookieOpts);

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
      // اگر DB در دسترس نبود، با payload فعلی ادامه بده
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
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';

  // لیست ترکیبات ممکن که باید پاک شوند تا در هر دو حالت قدیمی و جدید کوکی حذف شود
  const candidates = [];

  // 1) حالت فعلی (domain + sameSite بر اساس محیط)
  candidates.push(getCookieOptions(0));

  // 2) بدون domain، lax
  candidates.push({
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // 3) بدون domain، none + secure true (localhost قدیمی)
  candidates.push({
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });

  // 4) با domain اگر وجود دارد، اما sameSite none
  if (domain) {
    candidates.push({
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
      domain,
      maxAge: 0,
    });
    candidates.push({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain,
      maxAge: 0,
    });
    candidates.push({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      domain,
      maxAge: 0,
    });
  }

  // 5) حالت قدیمی با domain=localhost که مرورگر رد می‌کرد اما برای اطمینان
  candidates.push({
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    domain: 'localhost',
    maxAge: 0,
  });
  candidates.push({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    domain: 'localhost',
    maxAge: 0,
  });

  for (const opts of candidates) {
    try {
      cookieStore.set(SESSION_COOKIE, '', { ...opts, maxAge: 0 });
    } catch {}
  }

  // پاک کردن active workspace - چند حالت
  const activeCandidates = [
    {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      ...(domain ? { domain } : {}),
    },
    {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    },
    {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0,
    },
    {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0,
      domain: 'localhost',
    },
  ];

  for (const opts of activeCandidates) {
    try {
      cookieStore.set(ACTIVE_WORKSPACE_COOKIE, '', opts);
    } catch {}
  }
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
