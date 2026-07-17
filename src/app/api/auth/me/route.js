import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth-service';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'لاگین کنید' }, { status: 401 });
    const body = await request.json();
    const patch = {};
    if (body.avatarUrl !== undefined) patch.avatarUrl = body.avatarUrl || null;
    if (body.firstName !== undefined) patch.firstName = body.firstName;
    if (body.lastName !== undefined) patch.lastName = body.lastName;
    
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: 'داده‌ای برای بروزرسانی نیست' }, { status: 400 });
    }
    patch.updatedAt = new Date();
    const [updated] = await db.update(users).set(patch).where(eq(users.id, session.sub)).returning();
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[api/auth/me PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
