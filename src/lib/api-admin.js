import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const isSuper = session.globalRoles?.includes('super_admin') || session.role === 'super_admin';
  if (!isSuper) {
    return {
      error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session };
}
