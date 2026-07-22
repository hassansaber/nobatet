import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { assertBusinessAccess } from '@/services/business-service';
import { db } from '@/db';
import crypto from 'crypto';

function genToken() {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ ok: false, error: 'businessId' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub, ['owner', 'manager']);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { businessInvites } = await import('@/db/schema/auth.js');
    const rows = await db.select().from(businessInvites).where(eq(businessInvites.businessId, businessId)).orderBy(desc(businessInvites.createdAt)).limit(50);
    return NextResponse.json({ ok: true, invites: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { businessId, emailOrPhone, role } = body;
    if (!businessId || !emailOrPhone) return NextResponse.json({ ok: false, error: 'businessId و emailOrPhone' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub, ['owner', 'manager']);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const token = genToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { businessInvites } = await import('@/db/schema/auth.js');
    const [row] = await db.insert(businessInvites).values({
      businessId,
      emailOrPhone,
      role: role === 'manager' ? 'manager' : 'staff',
      token,
      invitedByUserId: session.sub,
      expiresAt,
    }).returning();

    // لینک دعوت
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
    const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
    const inviteUrl = `${protocol}://${baseDomain}/invite/${token}`;

    return NextResponse.json({ ok: true, invite: row, inviteUrl });
  } catch (e) {
    console.error('[invites POST]', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
