import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailableSlots, expireStaleLocks } from '@/services/booking-engine';

const querySchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberId: z.string().uuid().optional().nullable(),
});

export async function GET(request) {
  try {
    // آزادسازی قفل‌های منقضی (on-demand)
    await expireStaleLocks();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      businessId: searchParams.get('businessId'),
      serviceId: searchParams.get('serviceId'),
      date: searchParams.get('date'),
      memberId: searchParams.get('memberId') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'پارامترها نامعتبر است (businessId, serviceId, date=YYYY-MM-DD)',
        },
        { status: 400 },
      );
    }

    const result = await getAvailableSlots({
      businessId: parsed.data.businessId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      memberId: parsed.data.memberId || null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/public/slots]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
