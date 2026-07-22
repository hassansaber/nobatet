import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCorsHeaders, getCorsPreflightHeaders } from '@/lib/cors';

export async function GET(request) {
  try {
    const session = await getSession();
    const headers = getCorsHeaders(request);
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers });

    const dashboards = [];

    if (session.globalRoles?.includes('super_admin')) {
      dashboards.push({
        key: 'global-super_admin',
        type: 'global',
        role: 'super_admin',
        roleLabel: 'سوپرادمین',
        title: 'پنل سوپرادمین',
        desc: 'مدیریت کل پلتفرم',
        href: '/admin',
        redirectTo: '/admin',
        icon: 'crown',
        color: '#111827',
      });
    }
    if (session.globalRoles?.includes('visitor')) {
      dashboards.push({
        key: 'global-visitor',
        type: 'global',
        role: 'visitor',
        roleLabel: 'بازاریاب',
        title: 'پنل بازاریاب',
        desc: 'لینک اختصاصی، کمیسیون',
        href: '/visitor',
        redirectTo: '/visitor',
        icon: 'handshake',
        color: '#7c3aed',
      });
    }

    (session.memberships || []).forEach((m) => {
      const isOwner = ['owner', 'manager'].includes(m.role);
      dashboards.push({
        key: `biz-${m.businessId}`,
        type: 'business',
        role: m.role,
        roleLabel: m.role === 'owner' ? 'مالک' : m.role === 'manager' ? 'مدیر' : 'کارمند',
        title: m.businessName || m.businessSlug,
        desc: `${m.role === 'owner' ? 'مدیریت کامل' : m.role === 'manager' ? 'مدیریت' : 'پنل کارمند'} • ${m.businessSlug}`,
        href: isOwner ? '/business' : '/staff',
        redirectTo: isOwner ? '/business' : '/staff',
        businessId: m.businessId,
        businessSlug: m.businessSlug,
        icon: isOwner ? 'building' : 'briefcase',
        color: isOwner ? '#0284C7' : '#2563eb',
      });
    });

    if (dashboards.length === 0) {
      dashboards.push({
        key: 'customer',
        type: 'customer',
        role: 'customer',
        roleLabel: 'مشتری',
        title: 'پنل مشتری',
        desc: 'نوبت‌های من',
        href: '/me',
        redirectTo: '/me',
        icon: 'user',
        color: '#0284C7',
      });
    }

    return NextResponse.json({
      ok: true,
      session: {
        sub: session.sub,
        phone: session.phone,
        firstName: session.firstName,
        lastName: session.lastName,
        globalRoles: session.globalRoles,
        memberships: session.memberships,
      },
      dashboards,
      total: dashboards.length,
    }, { headers });
  } catch (err) {
    console.error('[workspaces]', err);
    const headers = getCorsHeaders(request);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500, headers });
  }
}

export async function OPTIONS(request) {
  const headers = getCorsPreflightHeaders(request);
  return new NextResponse(null, { status: 204, headers });
}
