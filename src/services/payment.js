/**
 * لایه پرداخت Provider-agnostic
 *
 * method: gateway | card_to_card | cash
 * status: pending | confirmed | rejected | failed | refunded
 *
 * فاز ۲:
 * - Sandbox gateway: شبیه‌سازی redirect + callback موفق/ناموفق
 * - کارت‌به‌کارت: ثبت رسید توسط مشتری + تأیید/رد توسط owner
 */

import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { bookings, payments } from '@/db/schema/bookings';
import { confirmBooking, cancelBooking } from '@/services/booking-engine';
import { sendSms } from '@/services/sms';
import { getBusinessById } from '@/services/business-service';
import { services } from '@/db/schema/services';

/**
 * @typedef {'gateway' | 'card_to_card' | 'cash'} PaymentMethod
 */

/**
 * ساخت رکورد پرداخت برای یک رزرو pending
 */
export async function createPaymentForBooking({
  bookingId,
  method,
  amount,
  extra = {},
}) {
  const [payment] = await db
    .insert(payments)
    .values({
      bookingId,
      method,
      status: method === 'cash' ? 'confirmed' : 'pending',
      amount,
      gatewayRef: extra.gatewayRef || null,
      sourceCardLast4: extra.sourceCardLast4 || null,
      transferCode: extra.transferCode || null,
      transferNote: extra.transferNote || null,
      transferReportedAt: extra.transferReportedAt || null,
      receiptImageUrl: extra.receiptImageUrl || null,
    })
    .returning();

  return payment;
}

/**
 * شروع پرداخت درگاه sandbox
 * @returns {{ ok: boolean, redirectUrl?: string, payment?: object, error?: string }}
 */
export async function startSandboxGatewayPayment({ booking, amount, returnBase }) {
  const authority = `SBX-${Date.now()}-${booking.id.slice(0, 8)}`;

  const payment = await createPaymentForBooking({
    bookingId: booking.id,
    method: 'gateway',
    amount,
    extra: { gatewayRef: authority },
  });

  // Always use main domain for payment - fixes 404 when booking from tenant subdomain
  let base = returnBase || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  // If returnBase is a tenant subdomain (contains .business. or .visitor.), fallback to main domain
  if (base.includes('.business.') || base.includes('.visitor.') || base.includes('demo.')) {
    base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }
  // Ensure no trailing slash
  base = base.replace(/\/$/, '');
  const redirectUrl = `${base}/pay/sandbox?authority=${encodeURIComponent(authority)}&paymentId=${payment.id}&amount=${amount}&bookingId=${booking.id}`;

  return { ok: true, payment, redirectUrl, authority };
}

/**
 * تأیید/رد callback درگاه sandbox
 * @param {{ paymentId: string, authority: string, success: boolean }} opts
 */
export async function completeSandboxGatewayPayment({
  paymentId,
  authority,
  success,
}) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) return { ok: false, error: 'پرداخت یافت نشد' };
  if (payment.method !== 'gateway') {
    return { ok: false, error: 'روش پرداخت درگاه نیست' };
  }
  if (payment.status !== 'pending') {
    return { ok: true, payment, alreadyProcessed: true };
  }
  if (authority && payment.gatewayRef && payment.gatewayRef !== authority) {
    return { ok: false, error: 'شناسه درگاه نامعتبر است' };
  }

  if (!success) {
    const [updated] = await db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();

    // آزاد کردن slot
    await db
      .update(bookings)
      .set({
        status: 'expired',
        lockExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookings.id, payment.bookingId),
          eq(bookings.status, 'pending_payment'),
        ),
      );

    return { ok: false, payment: updated, error: 'پرداخت ناموفق بود' };
  }

  const [updated] = await db
    .update(payments)
    .set({
      status: 'confirmed',
      gatewayRef: payment.gatewayRef || authority,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  const confirmed = await confirmBooking(payment.bookingId);
  if (!confirmed.ok) {
    return { ok: false, error: confirmed.error, payment: updated };
  }

  await notifyBookingConfirmed(confirmed.booking);

  return { ok: true, payment: updated, booking: confirmed.booking };
}

/**
 * ثبت اطلاعات کارت‌به‌کارت توسط مشتری - upgraded Task 12
 */
export async function submitCardToCardProof({
  bookingId,
  sourceCardLast4,
  transferCode,
  transferNote,
  transferReportedAt,
  receiptImageUrl,
}) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return { ok: false, error: 'رزرو یافت نشد' };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: 'این رزرو در انتظار پرداخت نیست' };
  }

  // تمدید قفل برای کارت‌به‌کارت
  const lockMins = Number(process.env.SLOT_LOCK_CARD_TO_CARD_MINUTES || 180);
  const lockExpiresAt = new Date(Date.now() + lockMins * 60_000);

  await db
    .update(bookings)
    .set({ lockExpiresAt, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // payment موجود یا جدید
  const existing = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.method, 'card_to_card'),
      ),
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);

  let payment = existing[0];
  if (payment) {
    [payment] = await db
      .update(payments)
      .set({
        status: 'pending',
        sourceCardLast4: sourceCardLast4 || payment.sourceCardLast4,
        transferCode: transferCode || payment.transferCode,
        transferNote: transferNote || payment.transferNote,
        transferReportedAt: transferReportedAt ? new Date(transferReportedAt) : new Date(),
        receiptImageUrl: receiptImageUrl || payment.receiptImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning();
  } else {
    payment = await createPaymentForBooking({
      bookingId,
      method: 'card_to_card',
      amount: booking.depositAmount,
      extra: {
        sourceCardLast4,
        transferCode,
        transferNote,
        transferReportedAt: transferReportedAt ? new Date(transferReportedAt) : new Date(),
        receiptImageUrl,
      },
    });
  }

  return {
    ok: true,
    payment,
    lockExpiresAt,
    message: 'اطلاعات واریز ثبت شد و منتظر تأیید صاحب کسب‌وکار است',
  };
}

/**
 * تأیید/رد کارت‌به‌کارت توسط owner
 */
export async function reviewCardToCardPayment({
  paymentId,
  reviewerId,
  approve,
  note,
}) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) return { ok: false, error: 'پرداخت یافت نشد' };
  if (payment.method !== 'card_to_card') {
    return { ok: false, error: 'این پرداخت کارت‌به‌کارت نیست' };
  }
  if (payment.status !== 'pending') {
    return { ok: false, error: 'این پرداخت قبلاً بررسی شده' };
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, payment.bookingId))
    .limit(1);

  if (!booking) return { ok: false, error: 'رزرو یافت نشد' };

  if (approve) {
    const [updated] = await db
      .update(payments)
      .set({
        status: 'confirmed',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note || null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    const confirmed = await confirmBooking(booking.id);
    if (!confirmed.ok) {
      return { ok: false, error: confirmed.error, payment: updated };
    }

    await notifyBookingConfirmed(confirmed.booking);
    // پترن #7 — اگر bodyId باشد
    await sendSmsSafe(booking.customerPhone, 'card_confirm', [
      booking.customerName,
    ]);

    return { ok: true, payment: updated, booking: confirmed.booking };
  }

  // رد
  const [updated] = await db
    .update(payments)
    .set({
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: note || null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  await cancelBooking(booking.id, note || 'پرداخت کارت‌به‌کارت رد شد');
  await sendSmsSafe(booking.customerPhone, 'card_reject', [
    booking.customerName,
  ]);

  return { ok: true, payment: updated, rejected: true };
}

/**
 * لیست پرداخت‌های کارت‌به‌کارت در انتظار برای یک بیزنس
 */
export async function listPendingCardPayments(businessId) {
  const rows = await db
    .select({
      payment: payments,
      booking: bookings,
    })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        eq(bookings.businessId, businessId),
        eq(payments.method, 'card_to_card'),
        eq(payments.status, 'pending'),
      ),
    )
    .orderBy(desc(payments.createdAt));

  return rows.map((r) => ({
    ...r.payment,
    booking: {
      id: r.booking.id,
      customerName: r.booking.customerName,
      customerPhone: r.booking.customerPhone,
      startsAt: r.booking.startsAt,
      endsAt: r.booking.endsAt,
      depositAmount: r.booking.depositAmount,
      totalAmount: r.booking.totalAmount,
      status: r.booking.status,
      serviceId: r.booking.serviceId,
    },
  }));
}

/**
 * بعد از قطعی شدن رزرو — پیامک مشتری + صاحب بیزنس (اگر bodyId باشد)
 */
export async function notifyBookingConfirmed(booking) {
  try {
    // باشگاه مشتریان — امتیاز
    try {
      const { awardPointsForBooking } = await import('@/services/crm-service');
      await awardPointsForBooking(booking);
    } catch (e) {
      console.warn('[payment] loyalty award skip', e?.message);
    }

    const biz = await getBusinessById(booking.businessId);
    const [svc] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);

    const dateFa = new Date(booking.startsAt).toLocaleDateString('fa-IR');
    const timeFa = new Date(booking.startsAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // پترن #2: نام، نام بیزنس، تاریخ، ساعت
    await sendSmsSafe(booking.customerPhone, 'booking_confirm', [
      booking.customerName,
      biz?.name || 'نوبتت',
      dateFa,
      timeFa,
    ], { businessId: booking.businessId });

    // پترن #3: نام مشتری، تاریخ، ساعت، خدمت
    if (biz?.phone) {
      const ownerPhone = normalizePhoneLoose(biz.phone);
      if (ownerPhone) {
        await sendSmsSafe(ownerPhone, 'booking_notify_owner', [
          booking.customerName,
          dateFa,
          timeFa,
          svc?.name || 'خدمت',
        ], { businessId: booking.businessId });
      }
    }
  } catch (err) {
    console.error('[payment] notifyBookingConfirmed', err);
  }
}

/**
 * ارسال SMS بدون پرتاب خطا اگر bodyId نباشد
 */
async function sendSmsSafe(to, pattern, vars, opts = {}) {
  if (!to) return { success: false, skipped: true };
  const result = await sendSms(to, pattern, vars, opts);
  if (!result.success) {
    console.warn('[sms:skip-or-fail]', pattern, result.error);
  }
  return result;
}

function normalizePhoneLoose(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  if (/^09\d{9}$/.test(p)) return p;
  if (/^9\d{9}$/.test(p)) return `0${p}`;
  return null;
}

export { sendSmsSafe };
