import { NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { assertBusinessAccess } from '@/services/business-service';
import { db } from '@/db';
import { waitlist } from '@/db/schema/crm';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ ok: false, error: 'businessId required' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const rows = await db.select().from(waitlist).where(eq(waitlist.businessId, businessId)).orderBy(desc(waitlist.createdAt)).limit(100);
    return NextResponse.json({ ok: true, waitlist: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { businessId, customerPhone, customerName, desiredDate, serviceId, note } = body;
    if (!businessId || !customerPhone) return NextResponse.json({ ok: false, error: 'businessId و phone الزامی' }, { status: 400 });
    const access = await assertBusinessAccess(businessId, session.sub);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const [row] = await db.insert(waitlist).values({
      businessId,
      customerPhone,
      customerName: customerName || null,
      desiredDate: desiredDate ? new Date(desiredDate) : null,
      serviceId: serviceId || null,
      note: note || null,
      status: 'waiting',
    }).returning();
    return NextResponse.json({ ok: true, waitlist: row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ ok: false, error: 'id و status' }, { status: 400 });
    const [row] = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
    if (!row) return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    const access = await assertBusinessAccess(row.businessId, session.sub);
    if (!access) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const [updated] = await db.update(waitlist).set({ status }).where(eq(waitlist.id, id)).returning();
    return NextResponse.json({ ok: true, waitlist: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
