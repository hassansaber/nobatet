import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'nobatet_session';

/**
 * مسیرهای محافظت‌شده و نقش‌های مجاز
 * Proxy فقط چک optimistic انجام می‌دهد — authorization نهایی در سرور/layout
 */
const PROTECTED = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/business', roles: ['business_owner', 'super_admin'] },
  { prefix: '/staff', roles: ['staff', 'business_owner', 'super_admin'] },
  { prefix: '/visitor', roles: ['visitor', 'super_admin'] },
  { prefix: '/me', roles: ['customer', 'business_owner', 'staff', 'visitor', 'super_admin'] },
];

/**
 * Next.js 16 Proxy (formerly Middleware)
 * - تشخیص subdomain و rewrite به /_sites/[tenant]
 * - چک optimistic نشست برای داشبوردها
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';

  // نادیده گرفتن فایل‌های استاتیک / api از subdomain rewrite
  // توجه: pathname.includes('.') قبلاً باعث می‌شد مسیرهای با نقطه هم skip شوند؛
  // فقط پسوند فایل‌های استاتیک را مستثنی می‌کنیم.
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|woff2?)$/i.test(
    pathname,
  );
  const isInternal =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/sites') ||
    pathname.startsWith('/pay') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/business') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/visitor') ||
    pathname.startsWith('/me') ||
    isStaticFile;

  // ─── Subdomain routing (wildcard) ───
  // moribarber.business.nobatet.com  → /sites/business/moribarber
  // reza.visitor.nobatet.com         → /sites/visitor/reza
  if (!isInternal) {
    const tenant = extractTenant(host, baseDomain);
    if (tenant) {
      const url = request.nextUrl.clone();
      url.pathname = `/sites/${tenant.type}/${tenant.slug}${pathname === '/' ? '' : pathname}`;
      const res = NextResponse.rewrite(url);
      res.headers.set('x-tenant-slug', tenant.slug);
      res.headers.set('x-tenant-type', tenant.type);
      return res;
    }
  }

  // ─── Auth gate for dashboards ───
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (rule) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!rule.roles.includes(session.role)) {
      const home = request.nextUrl.clone();
      home.pathname = dashboardPath(session.role);
      return NextResponse.redirect(home);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.sub);
    requestHeaders.set('x-user-role', session.role);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * همه مسیرها به‌جز:
     * - _next/static, _next/image
     * - favicon و فایل‌های تصویری رایج
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

/**
 * استخراج tenant از host (Wildcard)
 *
 * الگوهای پشتیبانی‌شده:
 *  - moribarber.business.nobatet.com → business / moribarber
 *  - ali.visitor.nobatet.com         → visitor / ali
 *  - moribarber.business.localhost   → business / moribarber (dev)
 *  - demo.localhost                  → business / demo (shorthand dev)
 */
function extractTenant(host, baseDomain) {
  const hostname = host.split(':')[0].toLowerCase();
  const baseHost = baseDomain.split(':')[0].toLowerCase();

  // host دقیقاً برابر base → بدون tenant (اپ اصلی)
  if (
    hostname === baseHost ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return null;
  }

  // 1) *.business.<base>  — الگوی اصلی درخواستی
  //    moribarber.business.nobatet.com
  //    moribarber.business.localhost
  const businessMarkers = [
    `.business.${baseHost}`,
    '.business.localhost',
  ];
  for (const marker of businessMarkers) {
    if (hostname.endsWith(marker)) {
      const slug = hostname.slice(0, -marker.length);
      if (slug && !slug.includes('.')) {
        return { type: 'business', slug };
      }
    }
  }

  // 2) *.visitor.<base>
  const visitorMarkers = [
    `.visitor.${baseHost}`,
    '.visitor.localhost',
  ];
  for (const marker of visitorMarkers) {
    if (hostname.endsWith(marker)) {
      const slug = hostname.slice(0, -marker.length);
      if (slug && !slug.includes('.')) {
        return { type: 'visitor', slug };
      }
    }
  }

  // 3) dev shorthand: slug.localhost (فقط business)
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace(/\.localhost$/, '');
    // اگر business./visitor. نبود
    if (slug && !slug.includes('.')) {
      return { type: 'business', slug };
    }
  }

  // 4) production shorthand: slug.nobatet.com (به‌جز www/api/app)
  if (hostname.endsWith(`.${baseHost}`)) {
    const sub = hostname.slice(0, -(baseHost.length + 1));
    if (
      sub &&
      !sub.includes('.') &&
      !['www', 'api', 'app', 'admin', 'business', 'visitor'].includes(sub)
    ) {
      return { type: 'business', slug: sub };
    }
  }

  return null;
}

async function verifySession(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );
    return {
      sub: String(payload.sub),
      role: String(payload.role || 'customer'),
      phone: String(payload.phone || ''),
    };
  } catch {
    return null;
  }
}

function dashboardPath(role) {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'visitor':
      return '/visitor';
    case 'business_owner':
      return '/business';
    case 'staff':
      return '/staff';
    default:
      return '/me';
  }
}
