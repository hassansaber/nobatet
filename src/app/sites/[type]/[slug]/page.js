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
      <div className="min-h-dvh bg-slate-50">
        <header className="bg-white border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-5 flex items-center gap-3">
            <span className="size-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-md">
              و
            </span>
            <div>
              <h1 className="font-black text-lg">{visitor.name}</h1>
              <p className="text-sm text-muted-foreground">
                نماینده رسمی نوبتت · کد {visitor.referralCode}
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-10 space-y-4">
          <div className="relative h-40 overflow-hidden rounded-3xl border border-border">
            <Image
              src="/images/cta-banner.jpg"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-teal-900/45" />
          </div>
          <section className="rounded-2xl bg-white border border-border p-6 shadow-sm">
            <h2 className="font-black text-xl">همراه من در نوبتت شروع کنید</h2>
            <p className="mt-3 text-base text-muted-foreground leading-8">
              {visitor.bio ||
                'با لینک این صفحه ثبت‌نام کنید و سیستم نوبت‌دهی خود را راه‌اندازی کنید.'}
            </p>
            <a
              href={registerHref}
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-md"
            >
              ثبت‌نام کسب‌وکار با کد معرف
            </a>
          </section>
        </main>
      </div>
    );
  }

  const biz = await getPublicBusinessLanding(slug);
  if (!biz) notFound();

  const primary = biz.theme?.primary || '#0d9488';
  const cover =
    biz.bannerUrl ||
    '/images/industry-salon.jpg';
  const mapQuery = encodeURIComponent(
    [biz.address, biz.city].filter(Boolean).join('، ') || biz.name,
  );

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      {/* Cover */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden">
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
            background: `linear-gradient(to top, ${primary}ee, ${primary}66 45%, transparent)`,
          }}
        />
        <div className="absolute bottom-0 inset-x-0 mx-auto max-w-3xl px-4 pb-5 text-white">
          <div className="flex items-end gap-4">
            <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-lg">
              <Image
                src={biz.logoUrl || '/logo-icon.png'}
                alt={biz.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="text-2xl sm:text-3xl font-black drop-shadow">
                {biz.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-white/90">
                {biz.city && <span>📍 {biz.city}</span>}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="underline-offset-2 hover:underline" dir="ltr">
                    📞 {biz.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {biz.description && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-black text-lg mb-2">درباره ما</h2>
            <p className="text-base text-muted-foreground leading-8">
              {biz.description}
            </p>
          </section>
        )}

        {/* Gallery */}
        <section>
          <h2 className="font-black text-lg mb-3">محیط کار</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              '/images/industry-salon.jpg',
              '/images/industry-barber.jpg',
              '/images/industry-clinic.jpg',
              '/images/industry-gym.jpg',
            ].map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-2xl border border-border ${i === 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-[4/3]'}`}
              >
                <Image
                  src={src}
                  alt={`${biz.name} گالری`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </section>

        {biz.landingFeatures?.services !== false && (
          <section>
            <h2 className="font-black text-lg mb-3">خدمات</h2>
            <div className="space-y-3">
              {biz.services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-teal-200 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-base">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {s.durationMinutes} دقیقه
                      {s.bufferMinutes ? ` · بافر ${s.bufferMinutes} دقیقه` : ''}
                    </p>
                  </div>
                  <p className="font-black text-base text-primary">
                    {formatRial(s.price)}{' '}
                    <span className="text-sm font-semibold text-muted-foreground">
                      تومان
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {biz.staff?.length > 0 && (
          <section>
            <h2 className="font-black text-lg mb-3">تیم ما</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {biz.staff.map((st, idx) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative mx-auto size-16 overflow-hidden rounded-full ring-2 ring-teal-100 bg-teal-50">
                    <Image
                      src={
                        [
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
                  <p className="mt-3 font-bold text-base">{st.name}</p>
                  {st.jobTitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {st.jobTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Map */}
        {(biz.address || biz.city) && (
          <section>
            <h2 className="font-black text-lg mb-3">آدرس و نقشه</h2>
            <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border">
                <p className="text-base font-bold text-foreground">
                  📍 {[biz.address, biz.city].filter(Boolean).join('، ')}
                </p>
                {biz.phone && (
                  <a
                    href={`tel:${biz.phone}`}
                    className="mt-2 inline-block text-base font-bold text-primary"
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
              <div className="p-3 border-t border-border">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  باز کردن در گوگل‌مپ ←
                </a>
              </div>
            </div>
          </section>
        )}

        <section id="book">
          <h2 className="font-black text-lg mb-3">رزرو نوبت</h2>
          <BookingWizard business={biz} primaryColor={primary} />
        </section>

        <p className="text-center text-sm text-muted-foreground pt-2">
          قدرت‌گرفته از{' '}
          <a href="/" className="text-primary font-bold">
            نوبتت
          </a>
        </p>
      </main>

      <a
        href="#book"
        className="fixed bottom-4 inset-x-4 sm:hidden mx-auto max-w-3xl flex h-13 min-h-12 items-center justify-center rounded-xl text-white font-black text-base shadow-lg"
        style={{ backgroundColor: primary }}
      >
        رزرو نوبت
      </a>
    </div>
  );
}
