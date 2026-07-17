import { NextResponse } from 'next/server';
import { listPlans, seedDefaultPlans } from '@/services/saas-service';

export async function GET() {
  try {
    await seedDefaultPlans();
    const plans = await listPlans({ publicOnly: true });
    return NextResponse.json({ ok: true, plans });
  } catch (err) {
    console.error('[api/public/plans]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
