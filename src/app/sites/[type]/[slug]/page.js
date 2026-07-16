import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getPublicBusinessLanding } from '@/services/business-service';
import { getVisitorBySlug } from '@/services/saas-service';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { formatRial } from '@/lib/utils';

export async function generateMetadata({ params }) {
  const { slug, type } = await params;
  if (type === 'visitor') {
    const v = await getVisitorBySlug(slug);
    return { title: v ? `ویزیتور ${v.name}` : `ویزیتور ${slug}` };
  }
  const biz = await getPublicBusinessLanding(slug);
  return {
    title: biz?.name || slug,
    description: biz?.description || undefined,
  };
}

export default async function TenantLandingPage({ params }) {
  const { slug, type } = await params;

  if (type === 'visitor') {
    const visitor = await getVisitorBySlug(slug);
    if (!visitor) notFound();
    const registerHref = `/register?ref=${encodeURIComponent(visitor.referralCode)}`;
    return (
      <div className="min-h-dvh bg-[#fdfcfb] relative overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#ccfbf1_0%,_transparent_60%),radial-gradient(ellipse_at_bottom_left,_#e0e7ff_0%,_transparent_50%)]" />
        </div>
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="size-11 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-teal-700/20">
                {visitor.name?.[0] || 'و'}
              </span>
              <div>
                <h1 className="font-black text-[15px] leading-none">{visitor.name}</h1>
                <p className="text-[11px] text-muted-foreground mt-1">ویزیتور رسمی نوبتت • کد {visitor.referralCode}</p>
              </div>
            </div>
            <a href={registerHref} className="hidden sm:inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md hover:bg-secondary transition-colors">
              شروع با کد من
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[11px] font-bold text-teal-800">
                <span className="size-1.5 rounded-full bg-teal-600 animate-pulse" />
                کمیسیون {visitor.commissionPercent || 20}% از هر اشتراک
              </div>
              <h2 className="mt-5 text-3xl sm:text-5xl font-black leading-[1.15] tracking-tight text-slate-900">
                با <span className="text-primary">{visitor.name}</span> <br />
                کسب‌وکارت را آنلاین کن
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-8 max-w-xl">
                {visitor.bio || 'من نماینده رسمی نوبتت هستم. با لینک اختصاصی من ثبت‌نام کن، نوبت‌دهی هوشمند، CRM و پرداخت آنلاین بگیر — راه‌اندازی زیر ۵ دقیقه.'}
              </p>
              
              <div className="mt-6 rounded-2xl bg-white border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">کد معرف شما</p>
                    <p className="text-2xl font-black tracking-widest mt-1 font-mono" dir="ltr">{visitor.referralCode}</p>
                  </div>
                  <div className="size-14 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl">🎁</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                  {[
                    { v: '۲۴/۷', l: 'رزرو آنلاین' },
                    { v: '0', l: 'تداخل زمانی' },
                    { v: `${visitor.commissionPercent || 20}%`, l: 'سود شما' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-slate-50 border border-border/50 p-2.5">
                      <p className="font-black text-primary text-base">{s.v}</p>
                      <p className="text-muted-foreground mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <a href={registerHref} className="flex-1 sm:flex-none inline-flex h-13 min-h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-black text-white shadow-lg shadow-teal-700/20 hover:bg-secondary hover:-translate-y-0.5 transition-all">
                  ثبت‌نام با کد معرف →
                </a>
                <a href="/" className="inline-flex h-13 min-h-12 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-bold hover:bg-slate-50">
                  نوبتت چیست؟
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-400/20 via-cyan-300/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl">
                <div className="relative aspect-[4/3]">
                  <Image src="/images/cta-banner.jpg" alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <p className="text-sm font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full inline-flex">پیشنهاد ویژه ویزیتور</p>
                    <h3 className="mt-3 text-xl font-black leading-snug">پلتفرم نوبت‌دهی + CRM برای سالن، کلینیک، آرایشگاه</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                  {[
                    { t: 'ساب‌دامین اختصاصی', d: 'salon.business.nobatet.com' },
                    { t: 'پیامک خودکار', d: 'OTP، یادآوری، تأیید' },
                    { t: 'پرداخت flexible', d: 'درگاه + کارت‌به‌کارت' },
                    { t: 'تقویم شمسی', d: 'جلالی + Asia/Tehran' },
                  ].map((f) => (
                    <div key={f.t} className="rounded-xl bg-slate-50 border border-border p-3">
                      <p className="font-bold text-slate-900 text-[13px]">{f.t}</p>
                      <p className="text-[11px] text-muted-foreground mt-1" dir="ltr">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 sm:mt-20">
            <h3 className="text-xl sm:text-2xl font-black text-center">چرا با لینک من ثبت‌نام کنی؟</h3>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { icon: '🚀', title: 'راه‌اندازی سریع', desc: 'کمتر از ۵ دقیقه، بدون کدنویسی، Mobile First' },
                { icon: '💎', title: 'پشتیبانی اختصاصی', desc: 'من به عنوان ویزیتور، راه‌اندازی و آموزش اولیه را کمکت می‌کنم' },
                { icon: '📈', title: 'رشد تضمینی', desc: 'کاهش تلفن‌ها، افزایش رزرو آنلاین و یادآوری خودکار' },
              ].map((b) => (
                <div key={b.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="size-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl">{b.icon}</div>
                  <h4 className="mt-4 font-black">{b.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-7">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-slate-900 text-white p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 size-80 bg-teal-500/20 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black">آماده‌ای کسب‌وکارت را متحول کنی؟</h3>
                <p className="mt-2 text-sm text-slate-300">با کد {visitor.referralCode} ثبت‌نام کن و همین امروز لینک رزروت را بگیر.</p>
              </div>
              <a href={registerHref} className="inline-flex h-12 items-center rounded-xl bg-white px-8 text-sm font-black text-slate-900 hover:bg-slate-100 transition-colors shadow-lg">
                شروع رایگان با کد معرف
              </a>
            </div>
          </div>
        </main>

        <footer className="border-t border-border mt-10 py-6 text-center text-xs text-muted-foreground">
          قدرت‌گرفته از <a href="/" className="font-bold text-primary">نوبتت</a> • ویزیتور {visitor.name}
        </footer>
      </div>
    );
  }

  const biz = await getPublicBusinessLanding(slug);
  if (!biz) notFound();

  const primary = biz.theme?.primary || '#0d9488';
  const cover = biz.bannerUrl || '/images/industry-salon.jpg';
  const logo = biz.logoUrl || '/logo-icon.png';
  const gallery = biz.galleryUrls?.length ? biz.galleryUrls : [
    '/images/industry-salon.jpg',
    '/images/industry-barber.jpg',
    '/images/industry-clinic.jpg',
    '/images/industry-gym.jpg',
  ];
  const mapQuery = encodeURIComponent(
    [biz.address, biz.city].filter(Boolean).join('، ') || biz.name,
  );

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      {/* Cover */}
      <div className="relative h-[300px] sm:h-[420px] w-full overflow-hidden">
        <Image
          src={cover}
          alt={biz.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${primary}ee 0%, ${primary}88 30%, ${primary}44 60%, transparent 100%)`,
          }}
        />
        {/* Top bar with instant booking button (Task 9) */}
        <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <span className="bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">✨ {biz.city || 'ایران'}</span>
          </div>
          <a href="#book" className="hidden sm:inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-black shadow-lg hover:bg-slate-50 transition-colors" style={{ color: primary }}>
            📅 دریافت نوبت فوری
          </a>
        </div>

        <div className="absolute bottom-0 inset-x-0 mx-auto max-w-3xl px-4 pb-6 text-white">
          <div className="flex items-end gap-4">
            <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-[1.2rem] border-[3px] border-white/90 bg-white shadow-xl">
              <Image
                src={logo}
                alt={biz.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 pb-1 flex-1">
              <h1 className="text-2xl sm:text-[32px] font-black drop-shadow leading-tight">
                {biz.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2.5 text-[13px] text-white/95">
                {biz.city && <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">📍 {biz.city}</span>}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full hover:bg-white/30 underline-offset-2" dir="ltr">
                    📞 {biz.phone}
                  </a>
                )}
                <span className="inline-flex items-center gap-1 bg-green-500/90 px-2.5 py-1 rounded-full font-bold">● باز</span>
              </div>
            </div>
          </div>
          {/* Booking button - visible on mobile top too */}
          <div className="mt-4 sm:hidden">
            <a href="#book" className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-white font-black text-[15px] shadow-lg" style={{ color: primary }}>
              📅 دریافت نوبت — همین الان رزرو کن
            </a>
          </div>
        </div>
      </div>

      {/* Sticky booking bar for desktop */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border hidden sm:block">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-slate-100 overflow-hidden relative">
              <Image src={logo} alt="" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate">{biz.name}</p>
              <p className="text-[11px] text-muted-foreground">رزرو آنلاین • بدون تماس</p>
            </div>
          </div>
          <a href="#book" className="inline-flex h-10 items-center rounded-xl px-5 text-sm font-black text-white shadow-md hover:opacity-90 transition-opacity" style={{ backgroundColor: primary }}>
            دریافت نوبت فوری
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-7">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { v: `${biz.services?.length || 0}+`, l: 'خدمت فعال' },
            { v: `${biz.staff?.length || 1}+`, l: 'متخصص' },
            { v: '★ 4.9', l: 'رضایت مشتری' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white border border-border p-3 text-center shadow-sm">
              <p className="font-black text-base" style={{ color: primary }}>{s.v}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {biz.description && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-black text-base mb-2 flex items-center gap-2">
              <span className="size-6 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: primary }}>ℹ</span>
              درباره ما
            </h2>
            <p className="text-[14px] text-muted-foreground leading-8">
              {biz.description}
            </p>
          </section>
        )}

        {/* Gallery */}
        <section>
          <h2 className="font-black text-[15px] mb-3 flex items-center gap-2">
            <span>🖼️</span> محیط کار
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {gallery.map((src, i) => (
              <div
                key={src + i}
                className={`relative overflow-hidden rounded-2xl border border-border ${i === 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-[4/3]'}`}
              >
                <Image
                  src={src}
                  alt={`${biz.name} گالری`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </section>

        {biz.landingFeatures?.services !== false && (
          <section>
            <h2 className="font-black text-[15px] mb-3 flex items-center gap-2">
              <span>💈</span> خدمات
            </h2>
            <div className="space-y-2.5">
              {biz.services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-teal-200 transition-colors group"
                >
                  <div>
                    <h3 className="font-bold text-[14px] group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s.durationMinutes} دقیقه
                      {s.bufferMinutes ? ` • بافر ${s.bufferMinutes} دقیقه` : ''} • تضمین بدون تداخل
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-[14px]" style={{ color: primary }}>
                      {formatRial(s.price)}{' '}
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        ت
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">پرداخت آنلاین</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {biz.staff?.length > 0 && (
          <section>
            <h2 className="font-black text-[15px] mb-3 flex items-center gap-2">
              <span>👥</span> تیم ما
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {biz.staff.map((st, idx) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="relative mx-auto size-16 overflow-hidden rounded-full ring-2 ring-teal-100 bg-teal-50 group-hover:ring-primary/30 transition-all">
                    <Image
                      src={
                        st.avatarUrl || [
                          '/images/feature-booking.jpg',
                          '/images/feature-crm.jpg',
                          '/images/feature-sms.jpg',
                          '/images/feature-payment.jpg',
                        ][idx % 4]
                      }
                      alt={st.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 font-bold text-[13px]">{st.name}</p>
                  {st.jobTitle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {st.jobTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(biz.address || biz.city) && (
          <section>
            <h2 className="font-black text-[15px] mb-3 flex items-center gap-2">
              <span>📍</span> آدرس و نقشه
            </h2>
            <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border">
                <p className="text-[13px] font-bold text-foreground">
                  {[biz.address, biz.city].filter(Boolean).join('، ')}
                </p>
                {biz.phone && (
                  <a
                    href={`tel:${biz.phone}`}
                    className="mt-2 inline-block text-[13px] font-bold"
                    style={{ color: primary }}
                    dir="ltr"
                  >
                    📞 {biz.phone}
                  </a>
                )}
              </div>
              <div className="relative aspect-[16/10] bg-slate-100">
                <iframe
                  title="نقشه"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                />
              </div>
              <div className="p-3 border-t border-border flex justify-between items-center">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-bold hover:underline"
                  style={{ color: primary }}
                >
                  باز کردن در گوگل‌مپ ←
                </a>
                <span className="text-[10px] text-muted-foreground">بروز شده با نقشه گوگل</span>
              </div>
            </div>
          </section>
        )}

        <section id="book" className="scroll-mt-20">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primary }}>✂</div>
            <h2 className="font-black text-[16px]">رزرو نوبت — سریع و قطعی</h2>
          </div>
          <BookingWizard business={biz} primaryColor={primary} />
        </section>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          قدرت‌گرفته از{' '}
          <a href="/" className="font-bold" style={{ color: primary }}>
            نوبتت
          </a>
          {' '}• رزرو هوشمند بدون تداخل
        </p>
      </main>

      <a
        href="#book"
        className="fixed bottom-4 inset-x-4 sm:hidden mx-auto max-w-3xl flex h-[52px] items-center justify-center rounded-[14px] text-white font-black text-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] z-30"
        style={{ backgroundColor: primary }}
      >
        📅 دریافت نوبت فوری
      </a>
    </div>
  );
}
