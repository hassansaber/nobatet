import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitCardToCardProof } from '@/services/payment';

const schema = z.object({
  bookingId: z.string().uuid(),
  sourceCardLast4: z.string().regex(/^\d{4}$/, { message: '۴ رقم آخر کارت مبدأ را وارد کنید' }),
  transferCode: z.string().max(80).optional().nullable(),
  transferNote: z.string().max(500).optional().nullable(),
  transferReportedAt: z.string().optional().nullable(),
  receiptImageUrl: z.string().url().optional().nullable().or(z.literal('')),
});

/**
 * ثبت رسید/اطلاعات واریز کارت‌به‌کارت توسط مشتری
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || 'داده نامعتبر',
        },
        { status: 400 },
      );
    }

    const result = await submitCardToCardProof({
      bookingId: parsed.data.bookingId,
      sourceCardLast4: parsed.data.sourceCardLast4,
      transferCode: parsed.data.transferCode || null,
      transferNote: parsed.data.transferNote || null,
      transferReportedAt: parsed.data.transferReportedAt,
      receiptImageUrl: parsed.data.receiptImageUrl || null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/public/payments/card-to-card]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
