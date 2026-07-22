import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { assertBusinessAccess } from '@/services/business-service';
import { db } from '@/db';
import { giftCards } from '@/db/schema/crm';

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ ok: false, error: 'businessId' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const rows = await db.select().from(giftCards).where(eq(giftCards.businessId, businessId)).orderBy(desc(giftCards.createdAt)).limit(100);
    return NextResponse.json({ ok: true, giftCards: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { businessId, amount, customerPhone, customerName } = body;
    if (!businessId || !amount) return NextResponse.json({ ok: false, error: 'businessId و amount' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub, ['owner', 'manager']);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const code = genCode();
    const [row] = await db.insert(giftCards).values({
      businessId,
      code,
      amount: Number(amount),
      balance: Number(amount),
      customerPhone: customerPhone || null,
      customerName: customerName || null,
    }).returning();
    return NextResponse.json({ ok: true, giftCard: row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
