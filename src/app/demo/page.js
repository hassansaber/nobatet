import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/FadeIn';
import { Store, Scissors, User, Handshake, Shield, Sparkles, Link2, Gem, ArrowLeft, Info } from 'lucide-react';

export const metadata = { title: 'دمو تعاملی' };

const accounts = [
  { role: 'صاحب کسب‌وکار', phone: '09120000001', pass: '123456', href: '/login', desc: 'داشبورد، رزرو، CRM، باشگاه، گزارش، اشتراک', Icon: Store },
  { role: 'کارمند', phone: '09120000002', pass: '123456', href: '/login', desc: 'تقویم امروز و وضعیت انجام نوبت', Icon: Scissors },
  { role: 'مشتری', phone: '09120000003', pass: '123456', href: '/login', desc: 'نوبت‌های پیش‌رو و تاریخچه', Icon: User },
  { role: 'ویزیتور', phone: '09120000004', pass: '123456', href: '/login', desc: 'لینک معرف و کمیسیون', Icon: Handshake },
  { role: 'سوپر ادمین', phone: '09120000000', pass: '123456', href: '/login', desc: 'نظارت پلتفرم، پلن‌ها، کاربران', Icon: Shield },
];

function getDemoUrls() {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
  const isLocal = baseDomain.includes('localhost') || baseDomain.startsWith('127.') || baseDomain.includes('lvh.me');
  const protocol = isLocal ? 'http' : 'https';
  return {
    // نسخه جدید تک سطحی: demo.nobatet.com به جای demo.business.nobatet.com
    businessDemo: `${protocol}://demo.${baseDomain}`,
    visitorDemo: `${protocol}://reza-visitor.${baseDomain}`,
    isLocal,
  };
}

export default function DemoPage() {
  const { businessDemo, visitorDemo, isLocal } = getDemoUrls();

  const flows = [
    { title: 'لندینگ سالن نمونه (wildcard تک سطحی)', href: businessDemo, desc: `رزرو واقعی — در پروداکشن: moristyle.nobatet.com (قبلاً demo.business.nobatet.com)`, cta: 'باز کردن لندینگ (same-tab)', Icon: Sparkles, external: true },
    { title: 'لندینگ ویزیتور (wildcard تک سطحی)', href: visitorDemo, desc: `صفحه معرف با کد REZA20 — reza-visitor.nobatet.com`, cta: 'مشاهده صفحه معرف', Icon: Link2, external: true },
    { title: 'قیمت‌گذاری پلن‌ها', href: '/pricing', desc: 'پلن‌های starter / pro / business', cta: 'دیدن قیمت‌ها', Icon: Gem },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <span className="inline-flex rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 mb-4">محیط دمو — داده seed آماده</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">دموی تعاملی نوبتت</h1>
            <p className="mt-3 text-muted-foreground leading-7 text-[14px]">
              بدون ساخت حساب، با شماره‌های آماده وارد هر نقش شوید یا مستقیم رزرو روی سالن نمونه را امتحان کنید.
              <br />
              <span className="inline-flex items-center gap-1 mt-2 rounded-lg bg-teal-50 border border-teal-100 px-2.5 py-1 text-xs text-teal-800"><Info className="size-3" /> سوییچ بین دمو و پلتفرم اکنون روان است — سشن بین هوم و لندینگ یکپارچه شده</span>
            </p>
          </FadeIn>

          <FadeIn delay={0.04} className="mt-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {['/images/industry-salon.jpg','/images/industry-clinic.jpg','/images/industry-barber.jpg','/images/industry-gym.jpg'].map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.05} className="mt-12"><h2 className="font-black text-lg mb-4">مسیرهای سریع</h2></FadeIn>
          <Stagger className="grid gap-4 sm:grid-cols-3">
            {flows.map((f) => (
              <StaggerItem key={f.href}>
                {f.external ? (
                  // مهم: بدون target=_blank برای سوییچ روان same-tab
                  <a href={f.href} className="block h-full rounded-2xl border border-border bg-white/80 backdrop-blur p-5 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 group-hover:scale-105 transition-all"><f.Icon className="size-5 text-primary" /></div>
                    <h3 className="font-bold text-[14px]">{f.title}</h3>
                    <p className="mt-2 text-[12px] text-muted-foreground leading-6">{f.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">{f.cta} <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /></span>
                    <p className="mt-2 text-[10px] text-muted-foreground">ناوبری same-tab • احراز هویت یکپارچه</p>
                  </a>
                ) : (
                  <Link href={f.href} className="block h-full rounded-2xl border border-border bg-white/80 backdrop-blur p-5 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 group-hover:scale-105 transition-all"><f.Icon className="size-5 text-primary" /></div>
                    <h3 className="font-bold text-[14px]">{f.title}</h3>
                    <p className="mt-2 text-[12px] text-muted-foreground leading-6">{f.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">{f.cta} <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /></span>
                  </Link>
                )}
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.08} className="mt-12">
            <h2 className="font-black text-lg mb-2">حساب‌های آماده</h2>
            <p className="text-sm text-muted-foreground mb-4">رمز همه: <strong dir="ltr">123456</strong> — ورود با «رمز عبور» — اکنون یکبار ورود برای هوم و لندینگ کافیست</p>
          </FadeIn>
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <StaggerItem key={a.phone}>
                <div className="rounded-2xl border border-border bg-white/80 backdrop-blur p-4 flex items-start gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className="size-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0"><a.Icon className="size-5 text-slate-700" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[13px]">{a.role}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-5">{a.desc}</p>
                    <p className="text-[12px] mt-2 font-mono bg-slate-50 border px-2 py-1 rounded-lg inline-block" dir="ltr">{a.phone}</p>
                  </div>
                  <Link href={a.href} className="shrink-0 inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-bold text-white cursor-pointer hover:bg-secondary transition-colors shadow-sm">ورود</Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.1} className="mt-12 rounded-2xl bg-teal-50 border border-teal-100 p-5 text-sm text-teal-900 leading-7">
            <p className="font-bold mb-1">پیشنهاد مسیر تست ۵ دقیقه‌ای (یکپارچه)</p>
            <ol className="list-decimal list-inside space-y-1 text-teal-800 text-[13px]">
              <li>ورود با owner (09120000001) → داشبورد</li>
              <li>از داشبورد روی «لندینگ» کلیک کن — باید بدون لاگین مجدد باز شود و header نام شما را نشان دهد</li>
              <li>از لندینگ روی «داشبورد» کلیک کن — باید same-tab برگردی به بیزنس</li>
              <li>خروج از داشبورد → برو به لندینگ → باید خارج شده باشی (logout یکپارچه)</li>
              <li>لندینگ demo → انتخاب خدمت → پرداخت sandbox موفق</li>
              <li>ورود visitor و super admin برای تست کمیسیون و ادمین</li>
            </ol>
            <p className="mt-3 text-[11px] text-teal-700/80">فیکس: کوکی دامنه .nobatet.com در پروداکشن، و SSO خودکار با token sync در localhost — دیگر نیازی به ورود جداگانه نیست</p>
          </FadeIn>
        </div>
      </main>
    </>
  );
}
