import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getPublicBusinessLanding } from '@/services/business-service';
import { getVisitorBySlug } from '@/services/saas-service';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { TenantHeader } from '@/components/layout/TenantHeader';
import { formatRial } from '@/lib/utils';
import {
  Gift,
  Rocket,
  Gem,
  TrendingUp,
  Sparkles,
  MapPin,
  Phone,
  CalendarDays,
  Info,
  Images,
  Scissors,
  Users,
  Building2,
  Star,
  Check,
  Clock,
  Link2,
  ShieldCheck,
  Video,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

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
        <header className="sticky top-0 z-20 glass-header">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center font-lalezar text-[16px] shadow-md shadow-teal-700/15">
                {visitor.name?.[0] || 'و'}
              </span>
              <div>
                <h1 className="font-lalezar text-[13px] leading-none tracking-tight">{visitor.name}</h1>
                <p className="text-[10px] text-muted-foreground mt-1">ویزیتور رسمی نوبتت • کد {visitor.referralCode}</p>
              </div>
            </div>
            <a href={registerHref} className="hidden sm:inline-flex h-9 items-center rounded-xl bg-primary px-4 text-[12px] font-medium text-white shadow-md hover:bg-secondary transition-colors">
              شروع با کد من
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full glass-blue px-3 py-1 text-[11px] font-medium text-teal-800">
                <span className="size-1.5 rounded-full bg-teal-600 animate-pulse" />
                کمیسیون {visitor.commissionPercent || 20}% از هر اشتراک
              </div>
              <h2 className="mt-5 font-lalezar text-[28px] sm:text-[42px] leading-[1.1] tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-lalezar)' }}>
                با <span className="text-primary">{visitor.name}</span> <br />
                کسب‌وکارت را آنلاین کن
              </h2>
              <p className="mt-4 text-[14px] sm:text-[15px] text-slate-600 leading-7 max-w-xl">
                {visitor.bio || 'من نماینده رسمی نوبتت هستم. با لینک اختصاصی من ثبت‌نام کن، نوبت‌دهی هوشمند، CRM و پرداخت آنلاین بگیر — راه‌اندازی زیر ۵ دقیقه.'}
              </p>
              
              <div className="mt-6 rounded-2xl glass p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Link2 className="size-3" /> کد معرف شما</p>
                    <p className="text-xl font-medium tracking-widest mt-1 font-mono" dir="ltr">{visitor.referralCode}</p>
                  </div>
                  <div className="size-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
                    <Gift className="size-5" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                  {[
                    { v: '۲۴/۷', l: 'رزرو آنلاین' },
                    { v: '0', l: 'تداخل زمانی' },
                    { v: `${visitor.commissionPercent || 20}%`, l: 'سود شما' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl glass-card p-2.5">
                      <p className="font-medium text-primary text-[13px]">{s.v}</p>
                      <p className="text-muted-foreground mt-0.5 text-[11px]">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <a href={registerHref} className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-[13px] font-medium text-white shadow-lg shadow-teal-700/15 hover:bg-secondary hover:-translate-y-0.5 transition-all cursor-pointer">
                  ثبت‌نام با کد معرف
                  <ArrowLeft className="size-4" />
                </a>
                <a href="/" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 glass px-5 text-[13px] font-medium hover:bg-white/60 cursor-pointer">
                  نوبتت چیست؟
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-400/15 via-cyan-300/8 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/50 glass-strong shadow-2xl">
                <div className="relative aspect-[4/3]">
                  <Image src="/images/cta-banner.jpg" alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-5 text-white">
                    <p className="text-[12px] font-medium bg-white/15 backdrop-blur px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"><Sparkles className="size-3" /> پیشنهاد ویژه ویزیتور</p>
                    <h3 className="mt-2 text-[18px] font-lalezar leading-snug hero-white">پلتفرم نوبت‌دهی + CRM برای سالن، کلینیک، آرایشگاه</h3>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2.5 text-[12px]">
                  {[
                    { t: 'ساب‌دامین اختصاصی', d: 'salon.business.nobatet.com' },
                    { t: 'پیامک خودکار', d: 'OTP، یادآوری، تأیید' },
                    { t: 'پرداخت flexible', d: 'درگاه + کارت‌به‌کارت' },
                    { t: 'تقویم شمسی', d: 'جلالی + Asia/Tehran' },
                  ].map((f) => (
                    <div key={f.t} className="rounded-xl glass-card p-2.5">
                      <p className="font-medium text-slate-900 text-[12px] flex items-center gap-1"><Check className="size-3 text-teal-600" />{f.t}</p>
                      <p className="text-[10px] text-muted-foreground mt-1" dir="ltr">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 sm:mt-20">
            <h3 className="font-lalezar text-[20px] sm:text-[24px] text-center tracking-tight">چرا با لینک من ثبت‌نام کنی؟</h3>
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              {[
                { Icon: Rocket, title: 'راه‌اندازی سریع', desc: 'کمتر از ۵ دقیقه، بدون کدنویسی، Mobile First' },
                { Icon: Gem, title: 'پشتیبانی اختصاصی', desc: 'من به عنوان ویزیتور، راه‌اندازی و آموزش اولیه را کمکت می‌کنم' },
                { Icon: TrendingUp, title: 'رشد تضمینی', desc: 'کاهش تلفن‌ها، افزایش رزرو آنلاین و یادآوری خودکار' },
              ].map((b) => (
                <div key={b.title} className="rounded-2xl glass p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><b.Icon className="size-4.5" /></div>
                  <h4 className="mt-3 font-lalezar text-[14px]">{b.title}</h4>
                  <p className="mt-1.5 text-[12px] text-muted-foreground leading-6">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-2xl glass-dark text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 size-80 bg-teal-500/20 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <h3 className="font-lalezar text-[20px] flex items-center gap-2"><Rocket className="size-5" /> آماده‌ای کسب‌وکارت را متحول کنی؟</h3>
                <p className="mt-1.5 text-[12px] text-slate-300">با کد {visitor.referralCode} ثبت‌نام کن و همین امروز لینک رزروت را بگیر.</p>
              </div>
              <a href={registerHref} className="inline-flex h-10 items-center rounded-xl bg-white px-6 text-[13px] font-medium text-slate-900 hover:bg-slate-100 transition-colors shadow-lg cursor-pointer">
                شروع رایگان با کد معرف
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const biz = await getPublicBusinessLanding(slug);
  if (!biz) notFound();

  const primary = biz.theme?.primary || '#0284C7';
  const cover = biz.bannerUrl || '/images/industry-salon.jpg';
  const logo = biz.logoUrl || '/logo-icon.png';
  const gallery = biz.galleryUrls?.length ? biz.galleryUrls : [
    '/images/industry-salon.jpg',
    '/images/industry-barber.jpg',
    '/images/industry-clinic.jpg',
    '/images/industry-gym.jpg',
  ];
  const mapQuery = encodeURIComponent([biz.address, biz.city].filter(Boolean).join('، ') || biz.name);

  const isCoverVideo = cover.endsWith('.mp4') || cover.endsWith('.webm') || cover.includes('/video');
  const isCoverUpload = cover.startsWith('/uploads/') || cover.startsWith('/api/files/');

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <TenantHeader businessName={biz.name} businessLogo={logo} primaryColor={primary} slug={slug} />

      {/* Cover with white heading - Lalezar + glass */}
      <div className="relative h-[320px] sm:h-[440px] w-full overflow-hidden bg-slate-900">
        {isCoverVideo ? (
          <video src={cover} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : isCoverUpload ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={biz.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image src={cover} alt={biz.name} fill className="object-cover" priority sizes="100vw" unoptimized={isCoverUpload} />
        )}
        {/* gradient overlay for white text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${primary}B8 0%, ${primary}55 40%, transparent 80%)` }} />

        {/* Top pill */}
        <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex justify-between items-center z-10">
          <span className="inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full text-[11px] font-medium text-white"><Sparkles className="size-3" /> {biz.city || 'ایران'}</span>
          <a href="#book" className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full glass-strong px-4 text-[12px] font-medium shadow-lg hover:bg-white/70 transition-colors" style={{ color: primary }}>
            <CalendarDays className="size-4" />
            دریافت نوبت فوری
          </a>
        </div>

        <div className="absolute bottom-0 inset-x-0 mx-auto max-w-3xl px-4 pb-5 text-white">
          <div className="flex items-end gap-3.5">
            <div className="relative size-[72px] sm:size-[84px] shrink-0 overflow-hidden rounded-[1.1rem] border-[2px] border-white/80 bg-white/90 shadow-xl backdrop-blur">
              <Image src={logo} alt={biz.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 pb-1 flex-1">
              {/* اصلی: سفید + لاله‌زار */}
              <h1 className="font-lalezar text-[26px] sm:text-[30px] leading-[1.1] hero-white tracking-tight" style={{ fontFamily: 'var(--font-lalezar)' }}>
                {biz.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-white/90">
                {biz.city && <span className="inline-flex items-center gap-1 glass px-2.5 py-1 rounded-full text-white"><MapPin className="size-3" /> {biz.city}</span>}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-1 glass px-2.5 py-1 rounded-full text-white hover:bg-white/20" dir="ltr">
                    <Phone className="size-3" />{biz.phone}
                  </a>
                )}
                <span className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur px-2.5 py-1 rounded-full font-medium text-[11px]"><span className="size-1.5 rounded-full bg-white animate-pulse" /> باز</span>
              </div>
            </div>
          </div>
          <div className="mt-3 sm:hidden">
            <a href="#book" className="inline-flex w-full h-11 items-center justify-center gap-1.5 rounded-xl glass-strong font-medium text-[13px] shadow-lg" style={{ color: primary }}>
              <CalendarDays className="size-4" />
              دریافت نوبت — همین الان
            </a>
          </div>
        </div>
      </div>

      {/* Sticky bar - glass */}
      <div className="sticky top-0 z-20 glass-header hidden sm:block">
        <div className="mx-auto max-w-3xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-white/70 overflow-hidden relative ring-1 ring-white/40 shadow-sm">
              <Image src={logo} alt="" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-lalezar text-[13px] truncate tracking-tight">{biz.name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-2.5" /> رزرو آنلاین • بدون تماس</p>
            </div>
          </div>
          <a href="#book" className="inline-flex h-8 items-center gap-1 rounded-xl px-3.5 text-[12px] font-medium text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer" style={{ backgroundColor: primary }}>
            <CalendarDays className="size-3.5" />
            دریافت نوبت
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5 sm:py-7 space-y-5">
        {/* Stats - glass */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: `${biz.services?.length || 0}+`, l: 'خدمت فعال' },
            { v: `${biz.staff?.length || 1}+`, l: 'متخصص' },
            { v: '4.9', l: 'رضایت مشتری', Icon: Star },
          ].map((s) => (
            <div key={s.l} className="rounded-xl glass-card p-3 text-center">
              <p className="font-medium text-[14px] flex items-center justify-center gap-1" style={{ color: primary }}>{s.Icon ? <Star className="size-3 fill-amber-400 text-amber-400" /> : null}{s.v}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {biz.description && (
          <section className="rounded-2xl glass p-4 shadow-md">
            <h2 className="font-lalezar text-[14px] mb-2 flex items-center gap-1.5 tracking-tight">
              <span className="size-5 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primary }}><Info className="size-3.5" /></span>
              درباره ما
            </h2>
            <p className="text-[12px] text-muted-foreground leading-7">
              {biz.description}
            </p>
          </section>
        )}

        <section>
          <h2 className="font-lalezar text-[13px] mb-2.5 flex items-center gap-1.5 tracking-tight">
            <Images className="size-4 text-primary" /> محیط کار {gallery.some((s)=>s.endsWith('.mp4')||s.endsWith('.webm')) ? '• ویدیو' : ''}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((src, i) => {
              const isVideo = src.endsWith('.mp4') || src.endsWith('.webm') || src.includes('/video') || /\.(mp4|webm)$/i.test(src);
              const isUpload = src.startsWith('/uploads/') || src.startsWith('/api/files/');
              return (
                <div key={src + i} className={`relative overflow-hidden rounded-xl glass-card ${i === 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-[4/3]'}`}>
                  {isVideo ? (
                    <video src={src} className="absolute inset-0 w-full h-full object-cover" controls muted loop playsInline />
                  ) : isUpload ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`${biz.name} گالری`} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <Image src={src} alt={`${biz.name} گالری`} fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                  )}
                  {isVideo && <span className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"><Video className="size-2.5" /> ویدیو</span>}
                </div>
              );
            })}
          </div>
        </section>

        {biz.landingFeatures?.services !== false && (
          <section>
            <h2 className="font-lalezar text-[13px] mb-2.5 flex items-center gap-1.5 tracking-tight">
              <Scissors className="size-4 text-primary" /> خدمات
            </h2>
            <div className="space-y-2">
              {biz.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl glass-card p-3.5 group">
                  <div>
                    <h3 className="font-medium text-[13px] group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="size-2.5" />{s.durationMinutes} دقیقه • بدون تداخل</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[13px]" style={{ color: primary }}>{formatRial(s.price)} <span className="text-[10px] text-muted-foreground">ت</span></p>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 justify-end"><ShieldCheck className="size-2.5" /> پرداخت آنلاین</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {biz.staff?.length > 0 && (
          <section>
            <h2 className="font-lalezar text-[13px] mb-2.5 flex items-center gap-1.5 tracking-tight">
              <Users className="size-4 text-primary" /> تیم ما
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {biz.staff.map((st, idx) => (
                <div key={st.id} className="rounded-xl glass-card p-3 text-center group">
                  <div className="relative mx-auto size-14 overflow-hidden rounded-full ring-1 ring-white/50 bg-white/60 group-hover:ring-primary/20 transition-all">
                    <Image src={st.avatarUrl || ['/images/feature-booking.jpg','/images/feature-crm.jpg','/images/feature-sms.jpg','/images/feature-payment.jpg'][idx % 4]} alt={st.name} fill className="object-cover" />
                  </div>
                  <p className="mt-2 font-medium text-[12px]">{st.name}</p>
                  {st.jobTitle && <p className="text-[10px] text-muted-foreground mt-0.5">{st.jobTitle}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {(biz.address || biz.city) && (
          <section>
            <h2 className="font-lalezar text-[13px] mb-2.5 flex items-center gap-1.5 tracking-tight">
              <MapPin className="size-4 text-primary" /> آدرس و نقشه
            </h2>
            <div className="rounded-xl glass overflow-hidden shadow-sm">
              <div className="p-3 border-b border-white/40">
                <p className="text-[12px] font-medium text-foreground">{[biz.address, biz.city].filter(Boolean).join('، ')}</p>
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: primary }} dir="ltr">
                    <Phone className="size-3.5" />{biz.phone}
                  </a>
                )}
              </div>
              <div className="relative aspect-[16/10] bg-slate-100">
                <iframe title="نقشه" className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`} />
              </div>
              <div className="p-2.5 border-t border-white/40 flex justify-between items-center">
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium hover:underline inline-flex items-center gap-1" style={{ color: primary }}>
                  گوگل‌مپ <ExternalLink className="size-3" />
                </a>
                <span className="text-[9px] text-muted-foreground">نقشه گوگل</span>
              </div>
            </div>
          </section>
        )}

        <section id="book" className="scroll-mt-20">
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="size-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primary }}><Scissors className="size-3.5" /></div>
            <h2 className="font-lalezar text-[14px] tracking-tight">رزرو نوبت — سریع و قطعی</h2>
          </div>
          <BookingWizard business={biz} primaryColor={primary} />
        </section>

        <p className="text-center text-[10px] text-muted-foreground pt-1">
          قدرت‌گرفته از <a href="/" className="font-medium" style={{ color: primary }}>نوبتت</a> • رزرو هوشمند
        </p>
      </main>

      <a href="#book" className="fixed bottom-4 inset-x-4 sm:hidden mx-auto max-w-3xl flex h-11 items-center justify-center gap-1.5 rounded-xl text-white font-medium text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.22)] z-30 cursor-pointer glass-dark" style={{ backgroundColor: primary }}>
        <CalendarDays className="size-4" />
        دریافت نوبت فوری
      </a>
    </div>
  );
}
