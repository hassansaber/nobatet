import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { listWorkingHours, setWorkingHours } from '@/services/business-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const memberId = new URL(request.url).searchParams.get('memberId');
    const hours = await listWorkingHours(auth.businessId, memberId || null);
    return NextResponse.json({
      ok: true,
      businessId: auth.businessId,
      hours,
    });
  } catch (err) {
    console.error('[api/business/hours GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
      businessId: body.businessId,
    });
    if (auth.error) return auth.error;

    if (!Array.isArray(body.hours)) {
      return NextResponse.json(
        { ok: false, error: 'hours باید آرایه باشد' },
        { status: 400 },
      );
    }

    const hours = await setWorkingHours(
      auth.businessId,
      body.hours,
      body.memberId || null,
    );
    return NextResponse.json({ ok: true, hours });
  } catch (err) {
    console.error('[api/business/hours PUT]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
