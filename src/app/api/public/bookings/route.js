import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeIranPhone } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import { getBusinessById } from '@/services/business-service';
import {
  createPendingBooking,
  confirmBooking,
  expireStaleLocks,
} from '@/services/booking-engine';
import {
  createPaymentForBooking,
  startSandboxGatewayPayment,
  notifyBookingConfirmed,
} from '@/services/payment';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { eq } from 'drizzle-orm';

const createSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid().optional(), // برای سازگاری قدیمی
  serviceIds: z.array(z.string().uuid()).optional(),
  memberId: z.string().uuid().optional().nullable(),
  startsAt: z.string().min(10),
  customerName: z.string().trim().min(2).max(160),
  customerPhone: z.string().min(10),
  policyAccepted: z.boolean(),
  notes: z.string().max(500).optional().nullable(),
  paymentMethod: z
    .enum(['sandbox', 'gateway', 'card_to_card', 'cash'])
    .default('sandbox'),
}).refine((data) => data.serviceId || (data.serviceIds && data.serviceIds.length > 0), {
  message: 'حداقل یک خدمت انتخاب کنید',
  path: ['serviceIds'],
});

export async function POST(request) {
  try {
    await expireStaleLocks();

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || 'داده نامعتبر' },
        { status: 400 },
      );
    }

    const phone = normalizeIranPhone(parsed.data.customerPhone);
    if (!phone) {
      return NextResponse.json({ ok: false, error: 'شماره موبایل معتبر نیست' }, { status: 400 });
    }

    const biz = await getBusinessById(parsed.data.businessId);
    if (!biz || !biz.isActive) {
      return NextResponse.json({ ok: false, error: 'کسب‌وکار یافت نشد' }, { status: 404 });
    }

    const session = await getSession();
    const methodRaw = parsed.data.paymentMethod;
    const isCard = methodRaw === 'card_to_card';
    const isCash = methodRaw === 'cash';
    const isGateway = methodRaw === 'gateway' || methodRaw === 'sandbox' || (!isCard && !isCash);

    const lockMinutes = isCard
      ? Number(process.env.SLOT_LOCK_CARD_TO_CARD_MINUTES || 180)
      : Number(process.env.SLOT_LOCK_MINUTES || 10);

    // نرمال‌سازی serviceIds
    let serviceIds = [];
    if (Array.isArray(parsed.data.serviceIds) && parsed.data.serviceIds.length > 0) serviceIds = parsed.data.serviceIds;
    else if (parsed.data.serviceId) serviceIds = [parsed.data.serviceId];
    serviceIds = [...new Set(serviceIds)];

    const pending = await createPendingBooking({
      businessId: parsed.data.businessId,
      serviceId: serviceIds[0],
      serviceIds,
      memberId: parsed.data.memberId || null,
      customerId: session?.sub || null,
      customerName: parsed.data.customerName,
      customerPhone: phone,
      startsAt: parsed.data.startsAt,
      policyAccepted: parsed.data.policyAccepted,
      notes: parsed.data.notes,
      depositPercent: biz.depositPercent ?? 100,
      lockMinutes,
    });

    if (!pending.ok) {
      return NextResponse.json(pending, { status: 409 });
    }

    const amount = pending.booking.depositAmount;

    if (isCard) {
      if (!biz.cardNumber) {
        return NextResponse.json({ ok: false, error: 'این کسب‌وکار شماره کارت ثبت نکرده است' }, { status: 400 });
      }
      const payment = await createPaymentForBooking({ bookingId: pending.booking.id, method: 'card_to_card', amount });
      return NextResponse.json({
        ok: true,
        booking: pending.booking,
        payment,
        service: pending.service,
        services: pending.services,
        needsCardTransfer: true,
        cardNumber: biz.cardNumber,
        cardHolderName: biz.cardHolderName,
        amount,
        lockExpiresAt: pending.lockExpiresAt,
        message: 'تایم قفل شد — مبلغ را کارت‌به‌کارت واریز و رسید را ثبت کنید',
      });
    }

    if (isCash) {
      const payment = await createPaymentForBooking({ bookingId: pending.booking.id, method: 'cash', amount, extra: { gatewayRef: `cash-${Date.now()}` } });
      const confirmed = await confirmBooking(pending.booking.id);
      if (!confirmed.ok) return NextResponse.json(confirmed, { status: 400 });
      await notifyBookingConfirmed(confirmed.booking);
      return NextResponse.json({ ok: true, booking: confirmed.booking, payment, service: pending.service, services: pending.services, message: 'رزرو حضوری ثبت و قطعی شد' });
    }

    if (isGateway) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://nobatet.com' : 'http://localhost:3001');
      const started = await startSandboxGatewayPayment({ booking: pending.booking, amount, returnBase: baseUrl });
      return NextResponse.json({
        ok: true,
        booking: pending.booking,
        payment: started.payment,
        service: pending.service,
        services: pending.services,
        needsGateway: true,
        redirectUrl: started.redirectUrl,
        lockExpiresAt: pending.lockExpiresAt,
        message: 'در حال انتقال به درگاه پرداخت آزمایشی',
      });
    }

    return NextResponse.json({ ok: false, error: 'روش پرداخت نامعتبر' }, { status: 400 });
  } catch (err) {
    console.error('[api/public/bookings]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id الزامی است' }, { status: 400 });

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return NextResponse.json({ ok: false, error: 'رزرو یافت نشد' }, { status: 404 });

    // خدمات چندگانه را هم بگیر
    let extraServices = [];
    try {
      const { bookingServices } = await import('@/db/schema/booking-services.js');
      const { services } = await import('@/db/schema/services.js');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select({ id: services.id, name: services.name }).from(bookingServices).innerJoin(services, eq(services.id, bookingServices.serviceId)).where(eq(bookingServices.bookingId, booking.id));
      extraServices = rows;
    } catch {}

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        customerName: booking.customerName,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        businessId: booking.businessId,
        serviceId: booking.serviceId,
        lockExpiresAt: booking.lockExpiresAt,
        services: extraServices,
      },
    });
  } catch (err) {
    console.error('[api/public/bookings GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
