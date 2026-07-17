import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

async function getDb() {
  const { db } = await import('@/db/index.js');
  return db;
}

/**
 * احراز هویت + resolve business برای APIهای پنل owner
 * نسخه جدید: از session.globalRoles و memberships استفاده می‌کند
 */
export async function requireBusinessSession(request, opts = {}) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const url = new URL(request.url);
  let businessId = opts.businessId || url.searchParams.get('businessId') || null;

  if (!businessId) {
    // از اولین membership فعال استفاده کن
    if (session.memberships && session.memberships.length > 0) {
      // اگر active workspace در کوکی انتخاب شده، آن را ترجیح بده
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const active = cookieStore.get('nobatet_active_workspace')?.value;
        if (active) {
          const found = session.memberships.find((m) => m.businessId === active || m.businessSlug === active);
          if (found) businessId = found.businessId;
        }
      } catch {}
      if (!businessId) businessId = session.memberships[0].businessId;
    } else {
      // fallback قدیمی: از سرویس resolve
      try {
        const { resolveBusinessId } = await import('@/services/business-service');
        businessId = await resolveBusinessId(session.sub, null);
      } catch {}
    }
  }

  if (!businessId) {
    return { error: NextResponse.json({ ok: false, error: 'بیزنسی یافت نشد' }, { status: 404 }) };
  }

  // super_admin bypass جدید: globalRoles
  const isSuperAdmin = session.globalRoles?.includes('super_admin');
  if (!isSuperAdmin) {
    const membership = session.memberships?.find((m) => m.businessId === businessId);
    if (!membership) {
      // برای اطمینان دوباره از DB هم چک کن (ممکن است سشن قدیمی باشد و membership جدید اضافه شده)
      try {
        const db = await getDb();
        const { businessMembers } = await import('@/db/schema/businesses.js');
        const { eq, and } = await import('drizzle-orm');
        const [row] = await db
          .select()
          .from(businessMembers)
          .where(and(eq(businessMembers.businessId, businessId), eq(businessMembers.userId, session.sub), eq(businessMembers.isActive, true)))
          .limit(1);
        if (!row) {
          return { error: NextResponse.json({ ok: false, error: 'دسترسی ندارید - عضویتی یافت نشد' }, { status: 403 }) };
        }
        // اگر ردیف وجود دارد ولی در سشن نیست (به خاطر tokenVersion قدیمی)، اجازه بده و سشن در getSession بعدی رفرش می‌شود
        if (opts.roles && !opts.roles.includes(row.role)) {
          return { error: NextResponse.json({ ok: false, error: 'دسترسی ندارید - نقش کافی نیست' }, { status: 403 }) };
        }
      } catch {
        return { error: NextResponse.json({ ok: false, error: 'دسترسی ندارید' }, { status: 403 }) };
      }
    } else {
      if (opts.roles && !opts.roles.includes(membership.role)) {
        return { error: NextResponse.json({ ok: false, error: 'دسترسی ندارید - نقش کافی نیست' }, { status: 403 }) };
      }
    }
  }

  return { session, businessId, userId: session.sub };
}

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const isSuperAdmin = session.globalRoles?.includes('super_admin') || session.role === 'super_admin';
  if (!isSuperAdmin) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden - super_admin required' }, { status: 403 }) };
  }
  return { session };
}

export async function requireGlobalRole(role) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const has = session.globalRoles?.includes(role) || session.role === role;
  if (!has) {
    return { error: NextResponse.json({ ok: false, error: `Forbidden - ${role} required` }, { status: 403 }) };
  }
  return { session };
}
