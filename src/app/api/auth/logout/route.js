import { NextResponse } from 'next/server';
import { logout } from '@/services/auth-service';

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/auth/logout]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
