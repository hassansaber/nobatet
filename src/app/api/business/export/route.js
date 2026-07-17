import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  exportBookingsCsv,
  exportCustomersCsv,
} from '@/services/crm-service';

/**
 * GET ?type=bookings|customers&days=30
 */
export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const sp = new URL(request.url).searchParams;
    const type = sp.get('type') || 'bookings';
    const days = Number(sp.get('days') || 30);

    let csv;
    let filename;
    if (type === 'customers') {
      csv = await exportCustomersCsv(auth.businessId);
      filename = `customers-${auth.businessId.slice(0, 8)}.csv`;
    } else {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - days);
      csv = await exportBookingsCsv(auth.businessId, { from, to });
      filename = `bookings-${days}d.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[api/business/export GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
