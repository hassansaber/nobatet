import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth-service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error('[api/auth/me]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
