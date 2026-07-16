import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listCustomerBookings } from '@/services/business-service';
import { cancelBooking } from '@/services/booking-engine';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { eq, or } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const items = await listCustomerBookings(session.sub, session.phone);
    const now = Date.now();
    const upcoming = items.filter(
      (b) =>
        new Date(b.startsAt).getTime() >= now &&
        ['confirmed', 'pending_payment'].includes(b.status),
    );
    const history = items.filter(
      (b) =>
        new Date(b.startsAt).getTime() < now ||
        ['completed', 'cancelled', 'no_show', 'expired'].includes(b.status),
    );

    return NextResponse.json({ ok: true, upcoming, history, all: items });
  } catch (err) {
    console.error('[api/me/bookings GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (body.action !== 'cancel' || !body.bookingId) {
      return NextResponse.json(
        { ok: false, error: 'فقط cancel پشتیبانی می‌شود' },
        { status: 400 },
      );
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, body.bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ ok: false, error: 'رزرو یافت نشد' }, { status: 404 });
    }

    const owns =
      booking.customerId === session.sub ||
      booking.customerPhone === session.phone;
    if (!owns) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    const result = await cancelBooking(
      body.bookingId,
      body.reason || 'لغو توسط مشتری',
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/me/bookings PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
