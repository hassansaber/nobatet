import { NextResponse } from 'next/server';
import { logout } from '@/services/auth-service';
import { getCorsHeaders, getCorsPreflightHeaders } from '@/lib/cors';

export async function POST(request) {
  const cors = getCorsHeaders(request);
  try {
    await logout();
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (err) {
    console.error('[api/auth/logout]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500, headers: cors });
  }
}

export async function OPTIONS(request) {
  const headers = getCorsPreflightHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request) {
  const cors = getCorsHeaders(request);
  try {
    await logout();
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500, headers: cors });
  }
}
