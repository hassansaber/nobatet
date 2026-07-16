import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  createTimeOff,
  deleteTimeOff,
  listTimeOffs,
} from '@/services/business-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const items = await listTimeOffs(auth.businessId);
    return NextResponse.json({
      ok: true,
      businessId: auth.businessId,
      timeOffs: items,
    });
  } catch (err) {
    console.error('[api/business/time-offs GET]', err);
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

    if (!body.startAt || !body.endAt) {
      return NextResponse.json(
        { ok: false, error: 'startAt و endAt الزامی است' },
        { status: 400 },
      );
    }

    const row = await createTimeOff(auth.businessId, body);
    return NextResponse.json({ ok: true, timeOff: row });
  } catch (err) {
    console.error('[api/business/time-offs POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
    });
    if (auth.error) return auth.error;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id الزامی است' }, { status: 400 });
    }

    const row = await deleteTimeOff(id, auth.businessId);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/business/time-offs DELETE]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
