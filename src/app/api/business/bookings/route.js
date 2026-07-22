import { NextResponse } from 'next/server';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import {
  assertBusinessAccess,
  getBusinessesForUser,
} from '@/services/business-service';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { services } from '@/db/schema/services';
import { cancelBooking, confirmBooking } from '@/services/booking-engine';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sp = new URL(request.url).searchParams;
    let businessId = sp.get('businessId');
    if (!businessId) {
      const list = await getBusinessesForUser(session.sub);
      businessId = list[0]?.id;
    }
    if (!businessId) {
      return NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(businessId, session.sub);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    const conditions = [eq(bookings.businessId, businessId)];
    const status = sp.get('status');
    if (status) conditions.push(eq(bookings.status, status));

    const from = sp.get('from');
    const to = sp.get('to');
    if (from) conditions.push(gte(bookings.startsAt, new Date(from)));
    if (to) conditions.push(lte(bookings.startsAt, new Date(to)));

    const rows = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        totalAmount: bookings.totalAmount,
        depositAmount: bookings.depositAmount,
        memberId: bookings.memberId,
        serviceName: services.name,
        serviceId: bookings.serviceId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(services, eq(services.id, bookings.serviceId))
      .where(and(...conditions))
      .orderBy(desc(bookings.startsAt))
      .limit(100);

    return NextResponse.json({ ok: true, businessId, bookings: rows });
  } catch (err) {
    console.error('[api/business/bookings GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

// POST - افزودن دستی نوبت (Quick Add) - برای مالک/منشی - حضوری بدون پرداخت
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { businessId: bId, customerName, customerPhone, serviceId, memberId, startsAt, endsAt, totalAmount, notes } = body;

    let businessId = bId;
    if (!businessId) {
      const list = await getBusinessesForUser(session.sub);
      businessId = list[0]?.id;
    }
    if (!businessId) return NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 });

    const access = await assertBusinessAccess(businessId, session.sub, ['owner', 'manager', 'staff']);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    if (!customerName || !customerPhone || !startsAt) {
      return NextResponse.json({ ok: false, error: 'نام، موبایل و زمان الزامی است' }, { status: 400 });
    }

    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 60 * 60 * 1000);

    const [row] = await db.insert(bookings).values({
      businessId,
      serviceId: serviceId || null,
      memberId: memberId || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      startsAt: start,
      endsAt: end,
      status: 'confirmed',
      totalAmount: Number(totalAmount || 0),
      depositAmount: 0,
      notes: notes || 'رزرو دستی - حضوری',
      policyAccepted: true,
    }).returning();

    return NextResponse.json({ ok: true, booking: row });
  } catch (err) {
    console.error('[api/business/bookings POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور: ' + err?.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, action, reason } = body;
    if (!bookingId || !action) {
      return NextResponse.json(
        { ok: false, error: 'bookingId و action الزامی است' },
        { status: 400 },
      );
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ ok: false, error: 'رزرو یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(booking.businessId, session.sub, [
      'owner',
      'manager',
      'staff',
    ]);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    if (action === 'cancel') {
      const result = await cancelBooking(bookingId, reason);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === 'confirm') {
      const result = await confirmBooking(bookingId);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === 'complete' || action === 'no_show') {
      const status = action === 'complete' ? 'completed' : 'no_show';
      const [updated] = await db
        .update(bookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
        .returning();
      return NextResponse.json({ ok: true, booking: updated });
    }

    return NextResponse.json({ ok: false, error: 'action نامعتبر' }, { status: 400 });
  } catch (err) {
    console.error('[api/business/bookings PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
