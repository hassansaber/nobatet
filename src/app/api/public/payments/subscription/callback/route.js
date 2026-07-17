import { NextResponse } from 'next/server';
import { markInvoicePaid } from '@/services/saas-service';
import { db } from '@/db';
import { subscriptionInvoices } from '@/db/schema/saas';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const body = await request.json();
    const { invoiceId, authority, success } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { ok: false, error: 'invoiceId الزامی است' },
        { status: 400 },
      );
    }

    if (!success) {
      await db
        .update(subscriptionInvoices)
        .set({ status: 'failed' })
        .where(eq(subscriptionInvoices.id, invoiceId));
      return NextResponse.json({
        ok: false,
        error: 'پرداخت اشتراک ناموفق بود',
      });
    }

    const result = await markInvoicePaid(invoiceId, { gatewayRef: authority });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/public/payments/subscription/callback]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
