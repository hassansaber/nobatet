import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-admin';
import {
  listAllPlans,
  seedDefaultPlans,
  upsertPlan,
} from '@/services/saas-service';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    await seedDefaultPlans();
    const plans = await listAllPlans();
    return NextResponse.json({ ok: true, plans });
  } catch (err) {
    console.error('[api/admin/plans GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ ok: false, error: 'نام پلن الزامی است' }, { status: 400 });
    }
    const result = await upsertPlan(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/admin/plans POST]', err);
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
    const result = await upsertPlan(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/admin/plans PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
