import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  createDiscountCode,
  listDiscountCodes,
  toggleDiscountCode,
} from '@/services/crm-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;
    const codes = await listDiscountCodes(auth.businessId);
    return NextResponse.json({ ok: true, codes });
  } catch (err) {
    console.error('[api/business/discounts GET]', err);
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

    const result = await createDiscountCode(auth.businessId, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/discounts POST]', err);
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

    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'id الزامی است' }, { status: 400 });
    }
    const row = await toggleDiscountCode(
      auth.businessId,
      body.id,
      body.isActive,
    );
    if (!row) {
      return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, code: row });
  } catch (err) {
    console.error('[api/business/discounts PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
