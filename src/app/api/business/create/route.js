import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBusiness } from '@/services/business-service';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * ساخت کسب‌وکار جدید برای کاربر لاگین‌شده
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: 'نام کسب‌وکار الزامی است' },
        { status: 400 },
      );
    }

    // promote to business_owner if not already owner/super_admin
    const isSuper = session.globalRoles?.includes('super_admin') || session.role === 'super_admin';
    const isOwner = session.memberships?.some((m) => m.role === 'owner') || session.role === 'business_owner';
    if (!isOwner && !isSuper) {
      await db.update(users).set({ role: 'business_owner', updatedAt: new Date() }).where(eq(users.id, session.sub));
    }

    const result = await createBusiness({
      ownerId: session.sub,
      name: body.name,
      slug: body.slug,
      description: body.description,
      phone: body.phone,
      city: body.city,
      referralCode: body.referralCode || null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/business/create]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
