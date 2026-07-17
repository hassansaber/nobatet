import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { addStaffMember, listStaff, updateStaffMember } from '@/services/business-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const staff = await listStaff(auth.businessId);
    return NextResponse.json({ ok: true, businessId: auth.businessId, staff });
  } catch (err) {
    console.error('[api/business/staff GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
      businessId: body.businessId,
    });
    if (auth.error) return auth.error;

    if (!body.phone) {
      return NextResponse.json(
        { ok: false, error: 'شماره موبایل الزامی است' },
        { status: 400 },
      );
    }

    const result = await addStaffMember(auth.businessId, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/staff POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
      businessId: body.businessId,
    });
    if (auth.error) return auth.error;

    if (!body.memberId) {
      return NextResponse.json(
        { ok: false, error: 'memberId الزامی است' },
        { status: 400 },
      );
    }

    const row = await updateStaffMember(body.memberId, auth.businessId, body);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'عضو یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, member: row });
  } catch (err) {
    console.error('[api/business/staff PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
