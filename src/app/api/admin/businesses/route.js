import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-admin';
import {
  adminListBusinesses,
  adminToggleBusiness,
} from '@/services/saas-service';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const businesses = await adminListBusinesses();
    return NextResponse.json({ ok: true, businesses });
  } catch (err) {
    console.error('[api/admin/businesses GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'id الزامی است' }, { status: 400 });
    }
    const row = await adminToggleBusiness(body.id, body.isActive);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, business: row });
  } catch (err) {
    console.error('[api/admin/businesses PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
