import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-admin';
import { adminListUsers, adminUpdateUser } from '@/services/saas-service';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const users = await adminListUsers();
    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error('[api/admin/users GET]', err);
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
    const allowedRoles = [
      'super_admin',
      'visitor',
      'business_owner',
      'staff',
      'customer',
    ];
    if (body.role && !allowedRoles.includes(body.role)) {
      return NextResponse.json({ ok: false, error: 'نقش نامعتبر' }, { status: 400 });
    }
    const row = await adminUpdateUser(body.id, body);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user: row });
  } catch (err) {
    console.error('[api/admin/users PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
