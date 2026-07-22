import { NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/cors';
import { refreshSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const cors = getCorsHeaders(request);
  try {
    const session = await refreshSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Refresh failed - please login again' }, { status: 401, headers: cors });
    }
    return NextResponse.json({ ok: true, session }, { headers: cors });
  } catch (e) {
    console.error('[api/auth/refresh]', e);
    const cors = getCorsHeaders(request);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500, headers: cors });
  }
}

export async function GET(request) {
  // برای سازگاری، GET هم ساپورت شود
  return POST(request);
}

export async function OPTIONS(request) {
  const { getCorsPreflightHeaders } = await import('@/lib/cors.js');
  const headers = getCorsPreflightHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}
