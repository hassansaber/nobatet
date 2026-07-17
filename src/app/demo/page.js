import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/FadeIn';

export const metadata = {
  title: 'دمو تعاملی',
};

const accounts = [
  {
    role: 'صاحب کسب‌وکار',
    phone: '09120000001',
    pass: '123456',
    href: '/login',
    desc: 'داشبورد، رزرو، CRM، باشگاه، گزارش، اشتراک',
    icon: '🏪',
  },
  {
    role: 'کارمند',
    phone: '09120000002',
    pass: '123456',
    href: '/login',
    desc: 'تقویم امروز و وضعیت انجام نوبت',
    icon: '💇',
  },
  {
    role: 'مشتری',
    phone: '09120000003',
    pass: '123456',
    href: '/login',
    desc: 'نوبت‌های پیش‌رو و تاریخچه',
    icon: '🙋',
  },
  {
    role: 'ویزیتور',
    phone: '09120000004',
    pass: '123456',
    href: '/login',
    desc: 'لینک معرف و کمیسیون',
    icon: '🤝',
  },
  {
    role: 'سوپر ادمین',
    phone: '09120000000',
    pass: '123456',
    href: '/login',
    desc: 'نظارت پلتفرم، پلن‌ها، کاربران',
    icon: '🛡️',
  },
];

const flows = [
  {
    title: 'لندینگ سالن نمونه (wildcard)',
    href: 'http://demo.business.localhost:3001',
    desc: 'رزرو واقعی — در production: demo.business.nobatet.com',
    cta: 'باز کردن لندینگ',
    icon: '✨',
    external: true,
  },
  {
    title: 'لندینگ ویزیتور (wildcard)',
    href: 'http://reza-visitor.visitor.localhost:3001',
    desc: 'صفحه معرف با کد REZA20 — reza-visitor.visitor.nobatet.com',
    cta: 'مشاهده صفحه معرف',
    icon: '🔗',
    external: true,
  },
  {
    title: 'قیمت‌گذاری پلن‌ها',
    href: '/pricing',
    desc: 'پلن‌های starter / pro / business',
    cta: 'دیدن قیمت‌ها',
    icon: '💎',
  },
];

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <span className="inline-flex rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 mb-4">
              محیط دمو — داده seed آماده
            </span>
            <h1 className="text-3xl sm:text-4xl font-black">دموی تعاملی نوبتت</h1>
            <p className="mt-3 text-muted-foreground leading-7">
              بدون ساخت حساب، با شماره‌های آماده وارد هر نقش شوید یا مستقیم رزرو
              روی سالن نمونه را امتحان کنید.
            </p>
          </FadeIn>

          <FadeIn delay={0.04} className="mt-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                '/images/industry-salon.jpg',
                '/images/industry-clinic.jpg',
                '/images/industry-barber.jpg',
                '/images/industry-gym.jpg',
              ].map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm">
                  <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.05} className="mt-12">
            <h2 className="font-black text-lg mb-4">مسیرهای سریع</h2>
          </FadeIn>
          <Stagger className="grid gap-4 sm:grid-cols-3">
            {flows.map((f) => (
              <StaggerItem key={f.href}>
                {f.external ? (
                  <a
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full rounded-2xl border border-border bg-white p-5 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <h3 className="font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-6">
                      {f.desc}
                    </p>
                    <span className="mt-4 inline-block text-sm font-bold text-primary">
                      {f.cta} ←
                    </span>
                  </a>
                ) : (
                  <Link
                    href={f.href}
                    className="block h-full rounded-2xl border border-border bg-white p-5 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <h3 className="font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-6">
                      {f.desc}
                    </p>
                    <span className="mt-4 inline-block text-sm font-bold text-primary">
                      {f.cta} ←
                    </span>
                  </Link>
                )}
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.08} className="mt-12">
            <h2 className="font-black text-lg mb-2">حساب‌های آماده</h2>
            <p className="text-sm text-muted-foreground mb-4">
              رمز همه: <strong dir="ltr">123456</strong> — ورود با «رمز عبور»
            </p>
          </FadeIn>
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <StaggerItem key={a.phone}>
                <div className="rounded-2xl border border-border bg-white p-4 flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {a.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{a.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.desc}
                    </p>
                    <p className="text-sm mt-2 font-mono" dir="ltr">
                      {a.phone}
                    </p>
                  </div>
                  <Link
                    href={a.href}
                    className="shrink-0 inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-bold text-white"
                  >
                    ورود
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.1} className="mt-12 rounded-2xl bg-teal-50 border border-teal-100 p-5 text-sm text-teal-900 leading-7">
            <p className="font-bold mb-1">پیشنهاد مسیر تست ۵ دقیقه‌ای</p>
            <ol className="list-decimal list-inside space-y-1 text-teal-800">
              <li>لندینگ demo → انتخاب خدمت → پرداخت sandbox موفق</li>
              <li>ورود owner → بخش رزروها / CRM / گزارش‌ها</li>
              <li>ورود visitor → مشاهده کمیسیون بعد از پرداخت اشتراک</li>
              <li>ورود super admin → نمای کلی پلتفرم</li>
            </ol>
          </FadeIn>
        </div>
      </main>
    </>
  );
}
