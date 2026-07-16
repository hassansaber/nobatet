import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { getBusinessReports } from '@/services/crm-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const sp = new URL(request.url).searchParams;
    const days = Number(sp.get('days') || 30);
    const fromParam = sp.get('from');
    const toParam = sp.get('to');

    const n = Number.isFinite(days) ? days : 30;
    let from;
    let to;
    if (fromParam || toParam) {
      to = toParam ? new Date(toParam) : new Date();
      from = fromParam
        ? new Date(fromParam)
        : (() => {
            const d = new Date(to);
            d.setDate(d.getDate() - n);
            return d;
          })();
    } else {
      from = new Date();
      from.setDate(from.getDate() - n);
      from.setHours(0, 0, 0, 0);
      to = new Date();
      to.setDate(to.getDate() + 60);
      to.setHours(23, 59, 59, 999);
    }

    const report = await getBusinessReports(auth.businessId, { from, to });
    return NextResponse.json({ ok: true, businessId: auth.businessId, report });
  } catch (err) {
    console.error('[api/business/reports GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
