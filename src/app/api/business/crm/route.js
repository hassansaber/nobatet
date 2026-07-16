import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import {
  listCrmCustomers,
  updateCustomerCrm,
  upsertCustomerProfile,
  listLoyaltyLedger,
  getCustomerProfile,
} from '@/services/crm-service';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const sp = new URL(request.url).searchParams;
    const phone = sp.get('phone');
    const tier = sp.get('tier') || undefined;
    const q = sp.get('q') || undefined;

    if (phone) {
      const profile = await getCustomerProfile(auth.businessId, phone);
      let ledger = [];
      if (profile?.id) {
        ledger = await listLoyaltyLedger(auth.businessId, profile.id);
      }
      return NextResponse.json({ ok: true, profile, ledger });
    }

    const customers = await listCrmCustomers(auth.businessId, { tier, q });
    return NextResponse.json({
      ok: true,
      businessId: auth.businessId,
      customers,
    });
  } catch (err) {
    console.error('[api/business/crm GET]', err);
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

    const key = body.profileId || body.phone;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'profileId یا phone الزامی است' },
        { status: 400 },
      );
    }

    const result = await updateCustomerCrm(auth.businessId, key, {
      displayName: body.displayName,
      notes: body.notes,
      tags: body.tags,
      tier: body.tier,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/crm PATCH]', err);
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
        { ok: false, error: 'phone الزامی است' },
        { status: 400 },
      );
    }

    const result = await upsertCustomerProfile(auth.businessId, body.phone, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/crm POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
