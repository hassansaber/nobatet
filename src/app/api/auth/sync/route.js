import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'nobatet_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

function getCookieDomain() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
    const host = base.split(':')[0].toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1') return 'localhost';
    if (host.startsWith('.')) return host;
    return `.${host}`;
  } catch { return undefined; }
}

function getCookieOptions(maxAgeSeconds) {
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  const isLocal = domain === 'localhost';
  const opts = {
    httpOnly: true,
    secure: isLocal ? true : isProd,
    sameSite: isLocal ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
  if (domain) opts.domain = domain;
  return opts;
}

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const h = {};
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

export async function POST(request) {
  const cors = corsHeaders(request);
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'token required' }, { status: 400, headers: cors });
    }
    // Verify token
    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401, headers: cors });
    }

    // Re-sign to ensure same expiration handling? Keep original token to preserve exp
    // But we will set the same token value (it was already signed)
    // Optionally create fresh token from userId to get updated payload
    const { db } = await import('@/db/index.js');
    const { users } = await import('@/db/schema/users.js');
    const { eq } = await import('drizzle-orm');
    const [user] = await db.select().from(users).where(eq(users.id, verified.sub)).limit(1);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404, headers: cors });
    }

    // Build fresh payload to ensure tokenVersion matches
    const { buildSessionPayload } = await import('@/lib/auth.js');
    const payload = await buildSessionPayload(verified.sub);

    const freshToken = await new SignJWT({
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
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '30d')
      .sign(getJwtSecret());

    const store = await cookies();
    const opts = getCookieOptions(60 * 60 * 24 * 30);

    // Try with domain, fallback without
    try {
      store.set(SESSION_COOKIE, freshToken, opts);
    } catch {
      const fallback = { ...opts };
      delete fallback.domain;
      store.set(SESSION_COOKIE, freshToken, fallback);
    }

    // Also set without domain as extra fallback for localhost subdomains that reject Domain attribute
    try {
      const fallback2 = { ...opts };
      delete fallback2.domain;
      // httpOnly false? No keep httpOnly
      store.set(SESSION_COOKIE, freshToken, fallback2);
    } catch {}

    return NextResponse.json({ ok: true, user: payload }, { headers: cors });
  } catch (e) {
    console.error('[api/auth/sync]', e);
    const cors = corsHeaders(request);
    return NextResponse.json({ ok: false, error: 'Server error: ' + e?.message }, { status: 500, headers: cors });
  }
}

export async function OPTIONS(request) {
  const cors = corsHeaders(request);
  const headers = {
    ...cors,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request) {
  // GET version for convenience: if session exists on main domain cookie, client on subdomain can call GET /api/auth/sync
  // but GET cannot read cookie from other domain; so we rely on POST with token. For same-origin GET, just check session.
  const cors = corsHeaders(request);
  try {
    const { getSession } = await import('@/lib/auth.js');
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No session on this subdomain' }, { status: 401, headers: cors });
    }
    return NextResponse.json({ ok: true, session }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500, headers: cors });
  }
}
