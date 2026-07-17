import { NextResponse } from 'next/server';
import { getPublicBusinessLanding } from '@/services/business-service';

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const data = await getPublicBusinessLanding(slug);
    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'کسب‌وکار یافت نشد' },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, business: data });
  } catch (err) {
    console.error('[api/public/businesses]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
