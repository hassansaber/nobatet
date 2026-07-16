import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }
  if (session.role !== 'super_admin') {
    return {
      error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session };
}
