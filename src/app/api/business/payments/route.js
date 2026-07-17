import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  assertBusinessAccess,
  getBusinessesForUser,
} from '@/services/business-service';
import {
  listPendingCardPayments,
  reviewCardToCardPayment,
} from '@/services/payment';

/**
 * لیست پرداخت‌های کارت‌به‌کارت در انتظار
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let businessId = new URL(request.url).searchParams.get('businessId');
    if (!businessId) {
      const list = await getBusinessesForUser(session.sub);
      businessId = list[0]?.id;
    }
    if (!businessId) {
      return NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(businessId, session.sub, [
      'owner',
      'manager',
    ]);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    const items = await listPendingCardPayments(businessId);
    return NextResponse.json({ ok: true, businessId, payments: items });
  } catch (err) {
    console.error('[api/business/payments GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * تأیید/رد کارت‌به‌کارت
 * body: { paymentId, action: 'approve' | 'reject', note? }
 */
export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, action, note } = body;
    if (!paymentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'paymentId و action (approve|reject) الزامی است' },
        { status: 400 },
      );
    }

    // پیش‌بررسی مالکیت
    const { db } = await import('@/db');
    const { bookings, payments } = await import('@/db/schema/bookings');
    const { eq } = await import('drizzle-orm');

    const [pay] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!pay) {
      return NextResponse.json({ ok: false, error: 'پرداخت یافت نشد' }, { status: 404 });
    }

    const [b] = await db
      .select({ businessId: bookings.businessId })
      .from(bookings)
      .where(eq(bookings.id, pay.bookingId))
      .limit(1);

    if (!b) {
      return NextResponse.json({ ok: false, error: 'رزرو یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(b.businessId, session.sub, [
      'owner',
      'manager',
    ]);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    const result = await reviewCardToCardPayment({
      paymentId,
      reviewerId: session.sub,
      approve: action === 'approve',
      note,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/payments PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
