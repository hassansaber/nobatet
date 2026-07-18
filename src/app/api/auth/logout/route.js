import { NextResponse } from 'next/server';
import { logout } from '@/services/auth-service';

function corsHeaders(request) {
  const origin = request?.headers?.get('origin') || '';
  const h = { Vary: 'Origin' };
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

export async function POST(request) {
  const cors = corsHeaders(request);
  try {
    await logout();
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (err) {
    console.error('[api/auth/logout]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500, headers: cors },
    );
  }
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || '';
  const headers = { Vary: 'Origin' };
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('lvh.me'))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request) {
  const cors = corsHeaders(request);
  try {
    await logout();
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500, headers: cors });
  }
}
