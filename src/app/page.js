import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import {
  FadeIn,
  Stagger,
  StaggerItem,
  HoverCard,
  ScaleIn,
} from '@/components/motion/FadeIn';

const featureCards = [
  {
    title: 'رزرو بدون تداخل',
    desc: 'موتور slot locking با بافر زمانی؛ دو مشتری هرگز یک ساعت را همزمان نمی‌گیرند.',
    image: '/images/feature-booking.jpg',
  },
  {
    title: 'CRM و باشگاه مشتریان',
    desc: 'تگ، VIP، امتیاز وفاداری، کد تخفیف و تاریخچه مراجعات در یک پنل.',
    image: '/images/feature-crm.jpg',
  },
  {
    title: 'پیامک خودکار',
    desc: 'OTP، تأیید رزرو، یادآوری ۲۴ و ۲ ساعت قبل — از طریق ملی‌پیامک.',
    image: '/images/feature-sms.jpg',
  },
  {
    title: 'پرداخت انعطاف‌پذیر',
    desc: 'درگاه آنلاین + کارت‌به‌کارت با تأیید دستی صاحب کسب‌وکار.',
    image: '/images/feature-payment.jpg',
  },
];

const moreFeatures = [
  {
    title: 'ساب‌دامین اختصاصی',
    desc: 'salon.business.nobatet.com — حس برند واقعی بدون وب‌سایت جدا.',
    icon: '🌐',
  },
  {
    title: 'ورود فقط با موبایل',
    desc: 'OTP پیامکی؛ بدون ایمیل، آشنا برای کاربر ایرانی.',
    icon: '📱',
  },
  {
    title: 'تقویم شمسی',
    desc: 'تاریخ جلالی در رزرو، مرخصی، گزارش و یادآوری.',
    icon: '🗓️',
  },
  {
    title: 'گزارش و Excel',
    desc: 'درآمد، نرخ لغو، پرکارترین خدمات و خروجی CSV.',
    icon: '📊',
  },
  {
    title: 'پنل کارمند',
    desc: 'تقویم شخصی، وضعیت انجام‌شد / نیامد.',
    icon: '💇',
  },
  {
    title: 'PWA قابل نصب',
    desc: 'نصب روی موبایل مثل اپ برای دسترسی سریع.',
    icon: '📲',
  },
];

const steps = [
  {
    n: '۱',
    t: 'ثبت‌نام با موبایل',
    d: 'OTP می‌گیرید، پروفایل را کامل می‌کنید — زیر ۲ دقیقه.',
  },
  {
    n: '۲',
    t: 'خدمات و تیم',
    d: 'خدمات، مدت، بافر، قیمت و کارمندان را تعریف کنید.',
  },
  {
    n: '۳',
    t: 'انتشار لینک رزرو',
    d: 'ساب‌دامین اختصاصی را در اینستاگرام یا برای مشتری بفرستید.',
  },
  {
    n: '۴',
    t: 'نوبت قطعی و یادآوری',
    d: 'پرداخت، پیامک تأیید و یادآوری خودکار.',
  },
];

const industries = [
  {
    title: 'سالن زیبایی',
    desc: 'کوتاهی، رنگ، ناخن، اکستنشن — چند کارمند بدون دوبل‌بوک.',
    image: '/images/industry-salon.jpg',
    href: '/register?role=business_owner',
  },
  {
    title: 'کلینیک و مطب',
    desc: 'ویزیت، مشاوره، قوانین لغو شفاف و پیگیری بیمار.',
    image: '/images/industry-clinic.jpg',
    href: '/register?role=business_owner',
  },
  {
    title: 'آرایشگاه آقایان',
    desc: 'اسلات‌های کوتاه، صف کمتر، باشگاه وفاداری.',
    image: '/images/industry-barber.jpg',
    href: '/register?role=business_owner',
  },
  {
    title: 'باشگاه و کلاس',
    desc: 'ظرفیت‌دار برای کلاس گروهی و جلسات خصوصی.',
    image: '/images/industry-gym.jpg',
    href: '/register?role=business_owner',
  },
];

const stats = [
  { value: '۲۴/۷', label: 'رزرو آنلاین بدون تلفن' },
  { value: '۰', label: 'تداخل زمانی در موتور رزرو' },
  { value: 'RTL', label: 'طراحی کامل فارسی' },
  { value: 'PWA', label: 'قابل نصب روی موبایل' },
];

const testimonials = [
  {
    name: 'مریم · مدیر سالن',
    text: 'قبلش نصف وقتم صرف جواب تلفن بود. الان مشتری خودش نوبت می‌گیرد و یادآوری هم می‌رود.',
  },
  {
    name: 'دکتر رضایی · مطب',
    text: 'قوانین لغو و بیعانه را شفاف کردیم؛ نرخ no-show خیلی کمتر شد.',
  },
  {
    name: 'علی · آرایشگاه',
    text: 'کارت‌به‌کارت برای مشتری‌های قدیمی عالی است؛ درگاه هم برای بقیه.',
  },
];

const faqs = [
  {
    q: 'بدون وب‌سایت هم می‌توانم استفاده کنم؟',
    a: 'بله. هر بیزنس ساب‌دامین اختصاصی می‌گیرد و همان صفحه، لندینگ رزرو شماست.',
  },
  {
    q: 'ثبت‌نام با ایمیل لازم است؟',
    a: 'خیر. احراز هویت فقط با شماره موبایل ایرانی و OTP پیامکی است.',
  },
  {
    q: 'اگر دو نفر همزمان یک ساعت را بزنند؟',
    a: 'موتور رزرو با قفل موقت (slot lock) و بررسی تداخل، double-book را جلوگیری می‌کند.',
  },
  {
    q: 'پرداخت چطور انجام می‌شود؟',
    a: 'درگاه آنلاین و کارت‌به‌کارت با تأیید دستی صاحب بیزنس.',
  },
  {
    q: 'روی موبایل خوب کار می‌کند؟',
    a: 'طراحی Mobile First است و به‌صورت PWA قابل نصب روی گوشی است.',
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-x-hidden">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#ccfbf1_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_left,_#e0f2fe_0%,_transparent_45%)]" />
            <div className="absolute -top-24 -left-24 size-72 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="absolute top-40 -right-20 size-80 rounded-full bg-cyan-300/20 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
              <FadeIn className="order-2 lg:order-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur">
                  <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
                  نوبت‌دهی هوشمند برای کسب‌وکار ایرانی
                </span>
                <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.25] tracking-tight text-slate-900">
                  صف تلفن را جمع کنید؛
                  <span className="block text-primary">نوبت را آنلاین بفروشید</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-slate-600 leading-8 max-w-xl">
                  نوبتت برای کلینیک، آرایشگاه، مطب و سالن زیبایی یک صفحه رزرو
                  حرفه‌ای + پنل مدیریت + CRM می‌سازد. تقویم شمسی، پیامک OTP، پرداخت
                  و ساب‌دامین اختصاصی — همه Mobile First.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="group inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-lg shadow-teal-700/25 transition-all hover:bg-secondary hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    شروع رایگان
                    <span className="mr-2 transition-transform group-hover:-translate-x-0.5">
                      ←
                    </span>
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white/90 px-6 text-base font-semibold text-slate-800 shadow-sm transition-all hover:bg-white hover:border-teal-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    مشاهده دمو تعاملی
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>✓ بدون نیاز به وب‌سایت جدا</span>
                  <span>✓ OTP موبایل ایرانی</span>
                  <span>✓ راه‌اندازی زیر ۵ دقیقه</span>
                </div>
              </FadeIn>

              <ScaleIn className="order-1 lg:order-2" delay={0.1}>
                <div className="relative mx-auto w-full max-w-lg">
                  <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-teal-400/30 via-cyan-300/20 to-transparent blur-2xl" />
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/40 shadow-2xl shadow-teal-900/15 backdrop-blur-sm">
                    <Image
                      src="/images/hero-banner.jpg"
                      alt="نوبت‌دهی آنلاین با نوبتت"
                      width={1200}
                      height={675}
                      className="h-auto w-full object-cover"
                      priority
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-2 sm:right-4 rounded-2xl border border-border bg-white px-4 py-3 shadow-xl shadow-slate-900/10">
                    <p className="text-[11px] text-muted-foreground">امروز</p>
                    <p className="text-sm font-black text-teal-700">
                      ۱۲ نوبت تأییدشده
                    </p>
                  </div>
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-white/80 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Stagger className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <StaggerItem key={s.label}>
                  <HoverCard className="rounded-2xl border border-border bg-slate-50/80 px-4 py-5 text-center transition-shadow hover:shadow-md hover:border-teal-100">
                    <p className="text-2xl sm:text-3xl font-black text-primary">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {s.label}
                    </p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Visual feature gallery */}
        <section id="features" className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <p className="text-sm font-bold text-primary mb-2">امکانات تصویری</p>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                همه‌چیز برای نوبت‌دهی مدرن
              </h2>
              <p className="mt-3 text-muted-foreground leading-7">
                از رزرو هوشمند تا CRM، پیامک و پرداخت — در یک پلتفرم فارسی.
              </p>
            </FadeIn>

            <Stagger className="grid gap-5 sm:grid-cols-2">
              {featureCards.map((f) => (
                <StaggerItem key={f.title}>
                  <Link href="/#how" className="block h-full">
                    <HoverCard className="group h-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl hover:border-teal-200">
                      <div className="relative aspect-[16/10] overflow-hidden bg-teal-50">
                        <Image
                          src={f.image}
                          alt={f.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                          <h3 className="font-black text-xl drop-shadow">{f.title}</h3>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-base text-muted-foreground leading-7">
                          {f.desc}
                        </p>
                      </div>
                    </HoverCard>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>

            <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.05}>
              {moreFeatures.map((f) => (
                <StaggerItem key={f.title}>
                  <Link href="/register" className="block h-full">
                    <HoverCard className="h-full rounded-2xl border border-border bg-slate-50/60 p-5 transition-colors hover:bg-teal-50/50 hover:border-teal-200 hover:shadow-md">
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-border">
                        {f.icon}
                      </div>
                      <h3 className="font-black text-base">{f.title}</h3>
                      <p className="mt-2 text-base text-muted-foreground leading-7">
                        {f.desc}
                      </p>
                    </HoverCard>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Dashboard preview */}
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <FadeIn>
                <p className="text-sm font-bold text-primary mb-2">پنل مدیریت</p>
                <h2 className="text-2xl sm:text-3xl font-black leading-snug">
                  داشبورد کامل برای صاحب کسب‌وکار
                </h2>
                <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-8">
                  رزروها، کارمندان، ساعات کاری، CRM، باشگاه مشتریان و گزارش درآمد —
                  همه در یک پنل موبایل‌فرست.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {[
                    'تقویم و لیست رزرو با فیلتر وضعیت',
                    'تأیید کارت‌به‌کارت و وضعیت نوبت',
                    'گزارش نمودار درآمد و نرخ لغو',
                    'خروجی CSV برای حسابداری',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                        ✓
                      </span>
                      <span className="leading-7">{t}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
              <ScaleIn delay={0.08}>
                <div className="relative">
                  <div className="absolute -inset-3 rounded-[2rem] bg-teal-300/20 blur-2xl" />
                  <HoverCard className="relative overflow-hidden rounded-3xl border border-border shadow-2xl shadow-teal-900/10">
                    <Image
                      src="/images/dashboard-preview.jpg"
                      alt="پیش‌نمایش داشبورد نوبتت"
                      width={1400}
                      height={788}
                      className="h-auto w-full object-cover"
                    />
                  </HoverCard>
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-bold text-primary mb-2">شروع سریع</p>
              <h2 className="text-2xl sm:text-4xl font-black">
                در ۴ قدم آماده فروش نوبت
              </h2>
            </FadeIn>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <StaggerItem key={s.n}>
                  <HoverCard className="relative h-full rounded-2xl bg-slate-50 border border-border p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-teal-200 hover:bg-white">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white font-black text-sm shadow-md shadow-teal-800/20">
                      {s.n}
                    </span>
                    <h3 className="mt-4 font-bold text-base">{s.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-7">
                      {s.d}
                    </p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Industries with photos */}
        <section id="industries" className="py-16 sm:py-24 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-bold text-primary mb-2">کاربردها</p>
              <h2 className="text-2xl sm:text-4xl font-black">
                مناسب چه کسب‌وکارهایی است؟
              </h2>
            </FadeIn>
            <Stagger className="grid gap-5 sm:grid-cols-2">
              {industries.map((item) => (
                <StaggerItem key={item.title}>
                  <Link href={item.href} className="block">
                    <HoverCard className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm hover:shadow-xl hover:border-teal-200">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                          <h3 className="font-black text-xl">{item.title}</h3>
                          <p className="mt-1 text-base text-white/90 leading-7">
                            {item.desc}
                          </p>
                          <span className="mt-3 inline-flex text-sm font-bold text-teal-100">
                            شروع برای این صنف ←
                          </span>
                        </div>
                      </div>
                    </HoverCard>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Customer flow */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <FadeIn>
                <p className="text-sm font-bold text-primary mb-2">تجربه مشتری</p>
                <h2 className="text-2xl sm:text-3xl font-black leading-snug">
                  مشتری از موبایل رزرو می‌کند؛ شما از پنل مدیریت می‌کنید
                </h2>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {[
                    'انتخاب خدمت، کارمند و ساعت آزاد روی موبایل',
                    'تأیید قوانین لغو قبل از پرداخت',
                    'پیامک تأیید و یادآوری خودکار',
                    'داشبورد بیزنس: رزرو، CRM، گزارش، کارمند',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                        ✓
                      </span>
                      <span className="leading-7">{t}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-secondary transition-colors"
                >
                  ساخت حساب کسب‌وکار
                </Link>
              </FadeIn>
              <ScaleIn delay={0.08}>
                <div className="relative overflow-hidden rounded-3xl border border-border bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
                  <div className="absolute -top-10 -left-10 size-40 rounded-full bg-teal-400/20 blur-2xl" />
                  <p className="text-xs text-teal-200/90 font-semibold">
                    نمونه جریان رزرو
                  </p>
                  <div className="mt-5 space-y-3 relative">
                    {[
                      { t: 'خدمت: کوتاهی مو', s: '۴۵ دقیقه' },
                      { t: 'زمان: فردا ۱۸:۳۰', s: 'آزاد' },
                      { t: 'پرداخت بیعانه', s: 'درگاه / کارت' },
                      { t: 'پیامک تأیید', s: 'ارسال شد' },
                    ].map((row) => (
                      <HoverCard
                        key={row.t}
                        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 backdrop-blur hover:bg-white/10"
                      >
                        <span className="text-sm font-medium">{row.t}</span>
                        <span className="text-xs text-teal-200">{row.s}</span>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* Gallery strip */}
        <section className="py-10 bg-slate-50 overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-black">نگاهی به فضای کسب‌وکارها</h2>
            </FadeIn>
            <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                '/images/industry-salon.jpg',
                '/images/industry-clinic.jpg',
                '/images/industry-barber.jpg',
                '/images/industry-gym.jpg',
              ].map((src, i) => (
                <StaggerItem key={src}>
                  <HoverCard className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm">
                    <Image
                      src={src}
                      alt={`گالری ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn className="text-center mb-12">
              <p className="text-sm font-bold text-primary mb-2">نظر کاربران</p>
              <h2 className="text-2xl sm:text-4xl font-black">
                صاحبان کسب‌وکار چه می‌گویند؟
              </h2>
            </FadeIn>
            <Stagger className="grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <StaggerItem key={t.name}>
                  <HoverCard className="h-full rounded-2xl border border-border bg-slate-50 p-6 hover:shadow-lg hover:border-teal-200 hover:bg-white">
                    <p className="text-sm leading-8 text-slate-700">«{t.text}»</p>
                    <p className="mt-5 text-xs font-bold text-teal-800">{t.name}</p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-24 bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <FadeIn className="text-center mb-10">
              <p className="text-sm font-bold text-primary mb-2">FAQ</p>
              <h2 className="text-2xl sm:text-4xl font-black">سوالات پرتکرار</h2>
            </FadeIn>
            <Stagger className="space-y-3">
              {faqs.map((f) => (
                <StaggerItem key={f.q}>
                  <HoverCard className="rounded-2xl border border-border bg-white p-5 sm:p-6 hover:shadow-md hover:border-teal-200">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {f.q}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-7">
                      {f.a}
                    </p>
                  </HoverCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Final CTA with banner */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeIn>
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-teal-900/20">
                <div className="absolute inset-0">
                  <Image
                    src="/images/cta-banner.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-teal-950/85 via-teal-800/75 to-cyan-700/70" />
                </div>
                <div className="relative px-6 py-14 sm:px-12 sm:py-20 text-center text-white">
                  <h2 className="text-2xl sm:text-4xl font-black leading-snug">
                    آماده‌اید نوبت‌ها را حرفه‌ای مدیریت کنید؟
                  </h2>
                  <p className="mt-4 text-teal-50 max-w-xl mx-auto leading-7 text-sm sm:text-base">
                    همین امروز حساب بسازید، خدمات را اضافه کنید و لینک رزرو را با
                    مشتری‌ها به اشتراک بگذارید.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/register"
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-base font-bold text-teal-800 transition-all hover:bg-teal-50 hover:-translate-y-0.5"
                    >
                      ساخت حساب رایگان
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-8 text-base font-bold text-white backdrop-blur transition-all hover:bg-white/20"
                    >
                      مشاهده قیمت‌ها
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
