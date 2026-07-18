import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth-service';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const origin = request?.headers?.get('origin') || '';
    const headers = {};
    // CORS for subdomain SSO - allow *.localhost and *.nobatet.com
    if (origin && (origin.includes('localhost') || origin.includes('nobatet.com') || origin.includes('business.localhost') || origin.includes('127.0.0.1'))) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401, headers });
    }
    return NextResponse.json({ ok: true, user }, { headers });
  } catch (err) {
    console.error('[api/auth/me]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {};
  if (origin && (origin.includes('localhost') || origin.includes('nobatet.com'))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
  return new NextResponse(null, { status: 204, headers });
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'لاگین کنید' }, { status: 401 });
    const body = await request.json();
    const patch = {};
    if (body.avatarUrl !== undefined) patch.avatarUrl = body.avatarUrl || null;
    if (body.firstName !== undefined) patch.firstName = body.firstName;
    if (body.lastName !== undefined) patch.lastName = body.lastName;
    
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: 'داده‌ای برای بروزرسانی نیست' }, { status: 400 });
    }
    patch.updatedAt = new Date();
    const [updated] = await db.update(users).set(patch).where(eq(users.id, session.sub)).returning();
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[api/auth/me PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
