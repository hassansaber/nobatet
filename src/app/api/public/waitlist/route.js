import { NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema/crm';
import { normalizeIranPhone } from '@/lib/utils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessId, customerPhone, customerName, desiredDate, serviceId } = body;
    if (!businessId || !customerPhone) return NextResponse.json({ ok: false, error: 'اطلاعات ناقص' }, { status: 400 });
    const phone = normalizeIranPhone(customerPhone);
    if (!phone) return NextResponse.json({ ok: false, error: 'شماره موبایل معتبر نیست' }, { status: 400 });
    const [row] = await db.insert(waitlist).values({
      businessId,
      customerPhone: phone,
      customerName: customerName || null,
      desiredDate: desiredDate ? new Date(desiredDate) : null,
      serviceId: serviceId || null,
      status: 'waiting',
    }).returning();
    return NextResponse.json({ ok: true, waitlist: row, message: 'در لیست انتظار ثبت شد - به محض آزاد شدن تماس می‌گیریم' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
