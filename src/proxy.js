import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'nobatet_session';

const PROTECTED = [
  {
    prefix: '/admin',
    check: (s) => s.globalRoles?.includes('super_admin') || s.role === 'super_admin',
  },
  {
    prefix: '/business',
    check: (s) =>
      s.globalRoles?.includes('super_admin') ||
      s.role === 'super_admin' ||
      s.memberships?.some((m) => ['owner', 'manager'].includes(m.role)) ||
      s.role === 'business_owner',
  },
  {
    prefix: '/staff',
    check: (s) =>
      s.globalRoles?.includes('super_admin') ||
      s.role === 'super_admin' ||
      (s.memberships && s.memberships.length > 0) ||
      ['staff', 'business_owner'].includes(s.role),
  },
  {
    prefix: '/visitor',
    check: (s) =>
      s.globalRoles?.includes('visitor') ||
      s.globalRoles?.includes('super_admin') ||
      ['visitor', 'super_admin'].includes(s.role),
  },
  {
    prefix: '/me',
    check: () => true,
  },
  {
    prefix: '/choose-workspace',
    check: () => true,
  },
];

// اسلاگ‌های رزرو - نباید tenant باشند (demo برای تست مجاز است)
const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'panel', 'root', 'system',
  'business', 'visitor', 'auth', 'login', 'register', 'logout', 'me', 'choose-workspace',
  'mail', 'ftp', 'cdn', 'assets', 'static', 'blog', 'docs', 'help', 'support', 'status', 'health',
  'billing', 'payment', 'pay', 'pricing', 'plans',
  'abuse', 'security', 'legal', 'privacy', 'terms',
  'nobatet', 'nobat',
]);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';

  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|woff2?)$/i.test(pathname);
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
    pathname.startsWith('/choose-workspace') ||
    isStaticFile;

  // فقط اگر مسیر عمومی است، tenant را چک کن
  if (!isInternal) {
    const tenant = extractTenant(host, baseDomain);
    if (tenant) {
      const url = request.nextUrl.clone();
      // نسخه جدید: /sites/[type]/[slug] - type می‌تواند auto باشد
      url.pathname = `/sites/${tenant.type}/${tenant.slug}${pathname === '/' ? '' : pathname}`;
      const res = NextResponse.rewrite(url);
      res.headers.set('x-tenant-slug', tenant.slug);
      res.headers.set('x-tenant-type', tenant.type);
      return res;
    }
  }

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

    if (!rule.check(session)) {
      const home = request.nextUrl.clone();
      home.pathname = dashboardPathForSession(session);
      return NextResponse.redirect(home);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.sub);
    requestHeaders.set('x-user-role', session.role || 'customer');
    if (session.globalRoles) requestHeaders.set('x-user-global-roles', session.globalRoles.join(','));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};

/**
 * استخراج tenant - نسخه جدید تک سطحی
 * جدید: moristyle.nobatet.com => {slug: moristyle, type: business(auto)}
 * قدیم (سازگار): moristyle.business.nobatet.com => {slug: moristyle, type: business}
 */
function extractTenant(host, baseDomain) {
  const hostname = host.split(':')[0].toLowerCase().trim();
  const baseHost = baseDomain.split(':')[0].toLowerCase().trim();

  if (!hostname || hostname === baseHost || hostname === 'localhost' || hostname === '127.0.0.1') return null;

  // --- سازگاری با الگوی قدیمی تودرتو ---
  // moristyle.business.nobatet.com
  const oldBusinessMarkers = [`.business.${baseHost}`, '.business.localhost', '.business.lvh.me'];
  for (const marker of oldBusinessMarkers) {
    if (hostname.endsWith(marker)) {
      const slug = hostname.slice(0, -marker.length);
      if (slug && !slug.includes('.') && !RESERVED.has(slug) && slug.length >= 3) {
        return { type: 'business', slug };
      }
    }
  }
  const oldVisitorMarkers = [`.visitor.${baseHost}`, '.visitor.localhost', '.visitor.lvh.me'];
  for (const marker of oldVisitorMarkers) {
    if (hostname.endsWith(marker)) {
      const slug = hostname.slice(0, -marker.length);
      if (slug && !slug.includes('.') && !RESERVED.has(slug) && slug.length >= 3) {
        return { type: 'visitor', slug };
      }
    }
  }

  // --- الگوی قدیمی .localhost تک سطحی ---
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace(/\.localhost$/, '');
    // اگر هنوز نقطه دارد، مثل demo.business که بالا هندل شد، اینجا نادیده بگیر
    if (!sub.includes('.') && sub && !RESERVED.has(sub) && sub.length >= 3) {
      return { type: 'business', slug: sub };
    }
  }

  if (hostname.endsWith('.lvh.me')) {
    const sub = hostname.replace(/\.lvh\.me$/, '');
    if (!sub.includes('.') && sub && !RESERVED.has(sub) && sub.length >= 3) {
      return { type: 'business', slug: sub };
    }
    // اگر sub مثل demo.business شامل نقطه بود، دوباره چک
    const parts = sub.split('.');
    if (parts.length === 2 && ['business', 'visitor'].includes(parts[1])) {
      const slug = parts[0];
      if (slug && !RESERVED.has(slug) && slug.length >= 3) {
        return { type: parts[1], slug };
      }
    }
  }

  // --- الگوی جدید تک سطحی: moristyle.nobatet.com ---
  if (hostname.endsWith(`.${baseHost}`)) {
    const sub = hostname.slice(0, -(baseHost.length + 1)); // moristyle یا moristyle.business
    
    if (!sub) return null;
    
    // اگر sub شامل نقطه است، احتمالاً الگوی قدیمی است که بالا هندل نشده (مثلاً demo.business)
    if (sub.includes('.')) {
      const parts = sub.split('.');
      // فقط دو بخشی را قبول کن
      if (parts.length === 2 && ['business', 'visitor'].includes(parts[1])) {
        const slug = parts[0];
        if (slug && !RESERVED.has(slug) && slug.length >= 3) {
          return { type: parts[1], slug };
        }
      }
      return null;
    }

    // تک سطحی جدید: moristyle
    if (!RESERVED.has(sub) && sub.length >= 3 && /^[a-z0-9-]+$/.test(sub)) {
      // type را auto می‌گذاریم، صفحه لندینگ خودش تشخیص می‌دهد business است یا visitor
      return { type: 'business', slug: sub };
    }
  }

  return null;
}

async function verifySession(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return {
      sub: String(payload.sub),
      role: String(payload.role || 'customer'),
      phone: String(payload.phone || ''),
      globalRoles: Array.isArray(payload.globalRoles) ? payload.globalRoles : [],
      memberships: Array.isArray(payload.memberships) ? payload.memberships : [],
    };
  } catch {
    return null;
  }
}

function dashboardPathForSession(session) {
  if (!session) return '/login';
  const total = (session.globalRoles?.length || 0) + (session.memberships?.length || 0);
  if (total > 1) return '/choose-workspace';
  if (session.globalRoles?.includes('super_admin') || session.role === 'super_admin') return '/admin';
  if (session.globalRoles?.includes('visitor') || session.role === 'visitor') return '/visitor';
  if (session.memberships && session.memberships.length === 1) {
    const m = session.memberships[0];
    if (['owner', 'manager'].includes(m.role)) return '/business';
    return '/staff';
  }
  if (session.role === 'business_owner') return '/business';
  if (session.role === 'staff') return '/staff';
  return '/me';
}
