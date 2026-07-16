import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export const SESSION_COOKIE = 'nobatet_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

/**
 * @typedef {Object} SessionPayload
 * @property {string} sub - user id
 * @property {string} phone
 * @property {string} role
 * @property {string} [firstName]
 * @property {string} [lastName]
 */

/**
 * ساخت JWT و ست کردن کوکی httpOnly
 * @param {SessionPayload} payload
 */
export async function createSession(payload) {
  const token = await new SignJWT({
    phone: payload.phone,
    role: payload.role,
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

/**
 * خواندن و verify نشست فعلی
 * @returns {Promise<(SessionPayload & { exp?: number }) | null>}
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub: String(payload.sub),
      phone: String(payload.phone ?? ''),
      role: String(payload.role ?? 'customer'),
      firstName: payload.firstName ? String(payload.firstName) : undefined,
      lastName: payload.lastName ? String(payload.lastName) : undefined,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Verify JWT خام (برای Proxy که cookies() ندارد)
 * @param {string | undefined} token
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
}

/**
 * @param {string} password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * @param {string} password
 * @param {string} hash
 */
export async function comparePassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * مسیر داشبورد بر اساس نقش
 * @param {string} role
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
 * بررسی دسترسی نقش
 * @param {string} role
 * @param {string[]} allowed
 */
export function hasRole(role, allowed) {
  return allowed.includes(role);
}
