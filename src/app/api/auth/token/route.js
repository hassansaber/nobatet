import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCorsHeaders, getCorsPreflightHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'nobatet_session';

export async function GET(request) {
  try {
    const cors = getCorsHeaders(request);
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'No session' }, { status: 401, headers: cors });
    }
    return NextResponse.json({ ok: true, token }, { headers: cors });
  } catch (e) {
    console.error('[api/auth/token]', e?.message);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  const headers = getCorsPreflightHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}
