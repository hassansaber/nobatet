import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  assertBusinessAccess,
  listServices,
  createService,
  getBusinessesForUser,
} from '@/services/business-service';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = new URL(request.url).searchParams.get('businessId');
    let bizId = businessId;

    if (!bizId) {
      const list = await getBusinessesForUser(session.sub);
      bizId = list[0]?.id;
    }
    if (!bizId) {
      return NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(bizId, session.sub);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    const items = await listServices(bizId);
    return NextResponse.json({ ok: true, businessId: bizId, services: items });
  } catch (err) {
    console.error('[api/business/services GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let businessId = body.businessId;
    if (!businessId) {
      const list = await getBusinessesForUser(session.sub);
      businessId = list[0]?.id;
    }
    if (!businessId) {
      return NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 });
    }

    const access = await assertBusinessAccess(businessId, session.sub, [
      'owner',
      'manager',
    ]);
    if (!access && !(session.globalRoles?.includes('super_admin') || session.role === 'super_admin')) {
      return NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 });
    }

    if (!body.name || !body.durationMinutes) {
      return NextResponse.json(
        { ok: false, error: 'نام و مدت خدمت الزامی است' },
        { status: 400 },
      );
    }

    const service = await createService(businessId, body);
    return NextResponse.json({ ok: true, service });
  } catch (err) {
    console.error('[api/business/services POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
