import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  adjustLoyaltyPoints,
  getLoyaltySettings,
  updateLoyaltySettings,
  upsertCustomerProfile,
} from '@/services/crm-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const settings = await getLoyaltySettings(auth.businessId);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error('[api/business/loyalty GET]', err);
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

    // تنظیمات یا تغییر امتیاز دستی
    if (body.action === 'adjust_points') {
      let profileId = body.profileId;
      if (!profileId && body.phone) {
        const up = await upsertCustomerProfile(auth.businessId, body.phone, {
          displayName: body.displayName,
        });
        if (!up.ok) return NextResponse.json(up, { status: 400 });
        profileId = up.profile.id;
      }
      if (!profileId) {
        return NextResponse.json(
          { ok: false, error: 'profileId یا phone الزامی است' },
          { status: 400 },
        );
      }
      const result = await adjustLoyaltyPoints({
        businessId: auth.businessId,
        profileId,
        points: Number(body.points),
        type: body.type || 'adjust',
        note: body.note,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    const settings = await updateLoyaltySettings(auth.businessId, body);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error('[api/business/loyalty PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
