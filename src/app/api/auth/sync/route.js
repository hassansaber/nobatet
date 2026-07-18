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

function getCookieDomain() {
  const host = getRawBaseHost();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return undefined;
  }
  if (host === 'lvh.me' || host.endsWith('.lvh.me')) {
    return '.lvh.me';
  }
  if (host.startsWith('.')) return host;
  const parts = host.split('.');
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join('.');
    return `.${lastTwo}`;
  }
  return `.${host}`;
}

function getCookieOptions(maxAgeSeconds) {
  const domain = getCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  const isLvh = getRawBaseHost() === 'lvh.me' || getRawBaseHost().endsWith('.lvh.me');

  if (!domain) {
    // localhost
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: maxAgeSeconds,
    };
  }

  if (isLvh) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      domain,
      maxAge: maxAgeSeconds,
    };
  }

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain,
    maxAge: maxAgeSeconds,
  };
}

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const h = {};
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Credentials'] = 'true';
    h['Vary'] = 'Origin';
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

    // ست اصلی
    store.set(SESSION_COOKIE, freshToken, opts);

    // اگر لوکال هستیم (بدون domain) یک نسخه lax هم ست کن
    if (!opts.domain) {
      try {
        store.set(SESSION_COOKIE, freshToken, {
          ...opts,
          sameSite: 'lax',
          secure: false,
        });
      } catch {}
    }

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
