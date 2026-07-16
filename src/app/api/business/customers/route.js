import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { listCustomers } from '@/services/business-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const customers = await listCustomers(auth.businessId);
    return NextResponse.json({
      ok: true,
      businessId: auth.businessId,
      customers,
    });
  } catch (err) {
    console.error('[api/business/customers GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
