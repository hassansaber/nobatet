import Link from 'next/link';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSession } from '@/lib/auth';
import { getBusinessesForUser } from '@/services/business-service';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { formatRial } from '@/lib/utils';
import { businessUrl, tenantHost } from '@/lib/tenant-url';
import { BusinessDashboardCharts } from '@/components/business/BusinessDashboardCharts';

export const metadata = { title: 'پنل کسب‌وکار' };

export default async function BusinessDashboardPage() {
  const session = await getSession();
  const list = session ? await getBusinessesForUser(session.sub) : [];
  const biz = list[0];

  let todayCount = 0;
  let monthRevenue = 0;
  let confirmedCount = 0;

  if (biz) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const todayRows = await db
      .select({ c: sql`count(*)::int` })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, biz.id),
          gte(bookings.startsAt, start),
          lt(bookings.startsAt, end),
          eq(bookings.status, 'confirmed'),
        ),
      );
    todayCount = todayRows[0]?.c || 0;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const rev = await db
      .select({
        total: sql`coalesce(sum(${bookings.totalAmount}),0)::int`,
        c: sql`count(*)::int`,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, biz.id),
          gte(bookings.startsAt, monthStart),
          eq(bookings.status, 'confirmed'),
        ),
      );
    monthRevenue = rev[0]?.total || 0;
    confirmedCount = rev[0]?.c || 0;
  }

  const stats = [
    { label: 'نوبت‌های امروز', value: String(todayCount) },
    {
      label: 'درآمد این ماه',
      value: monthRevenue ? formatRial(monthRevenue) : '۰',
      hint: 'تومان · فقط تأییدشده',
    },
    { label: 'رزروهای تأیید ماه', value: String(confirmedCount) },
    {
      label: 'لینک لندینگ',
      value: biz ? tenantHost('business', biz.slug) : '—',
      hint: biz
        ? `${biz.slug}.business.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nobatet.com'}`
        : 'بیزنس بسازید',
    },
  ];

  return (
    <DashboardShell title="پنل کسب‌وکار" role="business_owner">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black">
            {biz ? biz.name : 'سلام 👋'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {biz
              ? 'خلاصه وضعیت کسب‌وکار شما'
              : 'هنوز کسب‌وکاری به حساب شما وصل نیست. از seed دمو استفاده کنید یا بیزنس بسازید.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black mt-1 truncate">{s.value}</p>
                {s.hint && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {s.hint}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {biz && <BusinessDashboardCharts businessId={biz.id} />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/business/bookings', t: 'رزروها', d: 'تأیید، لغو، انجام‌شد' },
            { href: '/business/payments', t: 'پرداخت‌ها', d: 'تأیید کارت‌به‌کارت' },
            { href: '/business/services', t: 'خدمات', d: 'قیمت، مدت، بافر' },
            { href: '/business/staff', t: 'کارمندان', d: 'افزودن نیرو و نقش' },
            { href: '/business/schedule', t: 'زمان‌بندی', d: 'ساعات کاری و مرخصی' },
            { href: '/business/customers', t: 'CRM', d: 'تگ، VIP، یادداشت' },
            { href: '/business/loyalty', t: 'باشگاه', d: 'امتیاز و کد تخفیف' },
            { href: '/business/expenses', t: 'حسابداری', d: 'هزینه‌ها و سود' },
            { href: '/business/qr', t: 'QR کد', d: 'چاپ QR لندینگ' },
            { href: '/business/reports', t: 'گزارش‌ها', d: 'درآمد و آمار نموداری' },
            { href: '/business/settings', t: 'تنظیمات', d: 'لوگو، بنر، گالری، نقشه + QR' },
            ...(biz
              ? [
                  {
                    href: businessUrl(biz.slug),
                    t: 'لندینگ عمومی',
                    d: tenantHost('business', biz.slug),
                    external: true,
                  },
                ]
              : []),
          ].map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                // same-tab برای سوییچ روان - بدون target _blank
                rel="noopener noreferrer"
                className="rounded-2xl border border-border bg-white p-5 hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <p className="font-bold group-hover:text-primary transition-colors">{item.t} →</p>
                <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                  {item.d}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">same-tab • احراز هویت یکپارچه</p>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-border bg-white p-5 hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <p className="font-bold group-hover:text-primary transition-colors">{item.t}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.d}</p>
              </Link>
            ),
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
