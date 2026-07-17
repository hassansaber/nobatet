import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-admin';
import {
  adminListVisitors,
  adminApproveCommission,
} from '@/services/saas-service';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const visitors = await adminListVisitors();
    return NextResponse.json({ ok: true, visitors });
  } catch (err) {
    console.error('[api/admin/visitors GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const body = await request.json();
    if (body.action === 'commission' && body.commissionId) {
      const row = await adminApproveCommission(
        body.commissionId,
        body.status || 'approved',
      );
      return NextResponse.json({ ok: true, commission: row });
    }
    return NextResponse.json({ ok: false, error: 'action نامعتبر' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/visitors PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
