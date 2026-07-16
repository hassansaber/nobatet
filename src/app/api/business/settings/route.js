import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  getBusinessById,
  updateBusinessSettings,
} from '@/services/business-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request, {
      roles: ['owner', 'manager'],
    });
    if (auth.error) return auth.error;

    const business = await getBusinessById(auth.businessId);
    return NextResponse.json({ ok: true, business });
  } catch (err) {
    console.error('[api/business/settings GET]', err);
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

    const result = await updateBusinessSettings(auth.businessId, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/settings PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
