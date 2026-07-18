import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'nobatet_session';

function getCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {};
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

export async function GET(request) {
  try {
    const cors = getCorsHeaders(request);
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'No session' }, { status: 401, headers: cors });
    }
    // return trimmed token for SSO sync – the sync endpoint will verify and set it on the requesting subdomain
    // We also return user payload for debugging (without exposing secret)
    return NextResponse.json({ ok: true, token }, { headers: cors });
  } catch (e) {
    console.error('[api/auth/token]', e?.message);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {};
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
  return new NextResponse(null, { status: 204, headers });
}
