import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getStaffMemberForUser,
  listStaffBookings,
} from '@/services/business-service';
import { cancelBooking } from '@/services/booking-engine';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getStaffMemberForUser(session.sub);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'عضویت staff یافت نشد' },
        { status: 404 },
      );
    }

    const sp = new URL(request.url).searchParams;
    const from = sp.get('from') || undefined;
    const to = sp.get('to') || undefined;

    // اگر from نباشد — از ابتدای امروز
    const start = from
      ? from
      : (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        })();

    const items = await listStaffBookings(member.memberId, {
      from: start,
      to,
    });

    return NextResponse.json({
      ok: true,
      member,
      bookings: items,
    });
  } catch (err) {
    console.error('[api/staff/bookings GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getStaffMemberForUser(session.sub);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'عضویت staff یافت نشد' },
        { status: 404 },
      );
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

    if (!booking || booking.memberId !== member.memberId) {
      return NextResponse.json(
        { ok: false, error: 'رزرو متعلق به شما نیست' },
        { status: 403 },
      );
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

    if (action === 'cancel') {
      const result = await cancelBooking(bookingId, reason);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    return NextResponse.json({ ok: false, error: 'action نامعتبر' }, { status: 400 });
  } catch (err) {
    console.error('[api/staff/bookings PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
