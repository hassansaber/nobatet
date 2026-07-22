import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyToken, buildSessionPayload, createAccessToken, createRefreshTokenRecord } from '@/lib/auth';
import { getCorsHeaders, getCorsPreflightHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'nobatet_session';
const REFRESH_COOKIE = 'nobatet_refresh';

function getRawBaseHost() {
  try {
    const raw = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
    const host = raw.split('/')[0].split(':')[0].toLowerCase();
    return host || 'localhost';
  } catch { return 'localhost'; }
}

function getCookieDomain() {
  const host = getRawBaseHost();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) return undefined;
  if (host === 'lvh.me' || host.endsWith('.lvh.me')) return '.lvh.me';
  if (host.startsWith('.')) return host;
  const parts = host.split('.');
  if (parts.length > 2) return `.${parts.slice(-2).join('.')}`;
  return `.${host}`;
}

function getCookieOptions(maxAgeSeconds) {
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  const isLvh = getRawBaseHost() === 'lvh.me' || getRawBaseHost().endsWith('.lvh.me');
  if (!domain) {
    return { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: maxAgeSeconds };
  }
  if (isLvh) {
    return { httpOnly: true, secure: false, sameSite: 'lax', path: '/', domain, maxAge: maxAgeSeconds };
  }
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', domain, maxAge: maxAgeSeconds };
}

export async function POST(request) {
  const cors = getCorsHeaders(request);
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'token required' }, { status: 400, headers: cors });
    }
    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401, headers: cors });
    }

    const { db } = await import('@/db/index.js');
    const { users } = await import('@/db/schema/users.js');
    const { eq } = await import('drizzle-orm');
    const [user] = await db.select().from(users).where(eq(users.id, verified.sub)).limit(1);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404, headers: cors });
    }

    const payload = await buildSessionPayload(verified.sub, true);
    const accessToken = await createAccessToken(payload);

    let ip = null;
    let ua = null;
    try {
      const h = await headers();
      ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      ua = h.get('user-agent') || null;
    } catch {}

    const { token: refreshToken } = await createRefreshTokenRecord(verified.sub, ip, ua);

    const store = await cookies();
    const accessOpts = getCookieOptions(15 * 60);
    const refreshOpts = getCookieOptions(7 * 24 * 60 * 60);

    store.set(SESSION_COOKIE, accessToken, accessOpts);
    store.set(REFRESH_COOKIE, refreshToken, { ...refreshOpts, path: '/' });

    if (!accessOpts.domain) {
      try {
        store.set(SESSION_COOKIE, accessToken, { ...accessOpts, sameSite: 'lax', secure: false });
        store.set(REFRESH_COOKIE, refreshToken, { ...refreshOpts, sameSite: 'lax', secure: false, path: '/' });
      } catch {}
    }

    return NextResponse.json({ ok: true, user: payload }, { headers: cors });
  } catch (e) {
    console.error('[api/auth/sync]', e);
    const cors = getCorsHeaders(request);
    return NextResponse.json({ ok: false, error: 'Server error: ' + e?.message }, { status: 500, headers: cors });
  }
}

export async function OPTIONS(request) {
  const headers = getCorsPreflightHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request) {
  const cors = getCorsHeaders(request);
  try {
    const { getSession } = await import('@/lib/auth.js');
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No session' }, { status: 401, headers: cors });
    }
    return NextResponse.json({ ok: true, session }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500, headers: cors });
  }
}
