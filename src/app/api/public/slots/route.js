import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailableSlots, expireStaleLocks } from '@/services/booking-engine';

const querySchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  serviceIds: z.string().optional(), // comma separated
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberId: z.string().uuid().optional().nullable(),
});

export async function GET(request) {
  try {
    await expireStaleLocks();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      businessId: searchParams.get('businessId'),
      serviceId: searchParams.get('serviceId') || undefined,
      serviceIds: searchParams.get('serviceIds') || undefined,
      date: searchParams.get('date'),
      memberId: searchParams.get('memberId') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'پارامترها نامعتبر است' },
        { status: 400 },
      );
    }

    // پشتیبانی از چند خدمت: serviceIds=uuid1,uuid2 یا serviceId تکی
    let ids = [];
    if (parsed.data.serviceIds) {
      ids = parsed.data.serviceIds.split(',').map(s=>s.trim()).filter(Boolean);
    } else if (parsed.data.serviceId) {
      ids = [parsed.data.serviceId];
    }

    if (ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'حداقل یک خدمت انتخاب کنید' }, { status: 400 });
    }

    const result = await getAvailableSlots({
      businessId: parsed.data.businessId,
      serviceIds: ids,
      serviceId: ids[0], // سازگاری
      date: parsed.data.date,
      memberId: parsed.data.memberId || null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/public/slots]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
