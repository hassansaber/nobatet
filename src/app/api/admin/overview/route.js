import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-admin';
import { getPlatformOverview } from '@/services/saas-service';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const overview = await getPlatformOverview();
    return NextResponse.json({ ok: true, overview });
  } catch (err) {
    console.error('[api/admin/overview]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
