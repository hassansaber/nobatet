import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  createSubscriptionInvoice,
  getActiveSubscription,
  listBusinessInvoices,
  listPlans,
  seedDefaultPlans,
} from '@/services/saas-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    await seedDefaultPlans();
    const subscription = await getActiveSubscription(auth.businessId);
    const plans = await listPlans({ publicOnly: true });
    const invoices = await listBusinessInvoices(auth.businessId);

    return NextResponse.json({
      ok: true,
      businessId: auth.businessId,
      subscription,
      plans,
      invoices,
    });
  } catch (err) {
    console.error('[api/business/subscription GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * شروع پرداخت ارتقا/تمدید → sandbox
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
      businessId: body.businessId,
    });
    if (auth.error) return auth.error;

    if (!body.planId) {
      return NextResponse.json(
        { ok: false, error: 'planId الزامی است' },
        { status: 400 },
      );
    }

    const result = await createSubscriptionInvoice({
      businessId: auth.businessId,
      planId: body.planId,
      billingCycle: body.billingCycle === 'yearly' ? 'yearly' : 'monthly',
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const redirectUrl = `${origin}/pay/subscription?invoiceId=${result.invoice.id}&authority=${encodeURIComponent(result.authority)}&amount=${result.amount}`;

    return NextResponse.json({
      ok: true,
      invoice: result.invoice,
      plan: result.plan,
      redirectUrl,
      amount: result.amount,
    });
  } catch (err) {
    console.error('[api/business/subscription POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
