import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/FadeIn';
import { formatRial } from '@/lib/utils';
import { listPlans, seedDefaultPlans } from '@/services/saas-service';

export const metadata = { title: 'قیمت‌گذاری | نوبتت' };
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let plans = [];
  try {
    await seedDefaultPlans();
    plans = await listPlans({ publicOnly: true });
  } catch { plans = []; }

  if (!plans.length) {
    plans = [
      { id: '1', name: 'پلن پایه', code: 'base', tier: 'base', priceMonthly: 290000, price3Months: 790000, priceYearly: 2900000, description: 'شروع هوشمند', longDescription: '', maxStaff: 2, maxSmsPerMonth: 200, features: { crm: true } },
      { id: '2', name: 'پلن حرفه‌ای', code: 'pro', tier: 'pro', priceMonthly: 590000, price3Months: 1590000, priceYearly: 5900000, description: 'محبوب‌ترین', longDescription: '', maxStaff: 5, maxSmsPerMonth: 1000, features: { crm: true, loyalty: true, reports: true } },
      { id: '3', name: 'پلن سازمانی', code: 'enterprise', tier: 'enterprise', priceMonthly: 1290000, price3Months: 3490000, priceYearly: 12900000, description: 'نامحدود + پشتیبانی', longDescription: '', maxStaff: 20, maxSmsPerMonth: 5000, features: { crm: true, loyalty: true, reports: true } },
    ];
  }

  // Sort by tier
  plans.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">پلن مناسب کسب‌وکارتان را انتخاب کنید</h1>
            <p className="mt-4 text-muted-foreground leading-7">هر پلن در سه دوره قابل خرید است: <span className="font-bold text-foreground">۱ ماهه، ۳ ماهه (۱۰٪ تخفیف)، ۱ ساله (۲۰٪ تخفیف)</span>. شامل محدودیت کارمند و پیامک.</p>
          </FadeIn>

          <Stagger className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => {
              const highlighted = plan.tier === 'pro' || plan.code === 'pro' || i === 1;
              const monthly = plan.priceMonthly;
              const three = plan.price3Months || Math.round(monthly*3*0.9);
              const yearly = plan.priceYearly || Math.round(monthly*12*0.8);
              const features = [
                `${plan.maxStaff || '—'} کارمند فعال`,
                `${plan.maxSmsPerMonth ? formatRial(plan.maxSmsPerMonth) : 'نامحدود'} پیامک / ماه`,
                `${plan.maxServices || 'نامحدود'} خدمت`,
                plan.features?.crm ? 'CRM پیشرفته' : null,
                plan.features?.loyalty ? 'باشگاه مشتریان' : 'باشگاه پایه',
                plan.features?.reports ? 'گزارش پیشرفته + نمودار' : 'گزارش پایه',
                plan.features?.expenses ? 'حسابداری هزینه‌ها' : null,
                plan.features?.qrCode ? 'QR کد لندینگ' : null,
                plan.features?.customTheme ? 'تم اختصاصی لندینگ' : 'تم پایه',
                plan.features?.customDomain ? 'دامنه اختصاصی' : null,
              ].filter(Boolean);

              return (
                <StaggerItem key={plan.id || plan.code}>
                  <div className={`h-full rounded-[1.5rem] border p-6 flex flex-col relative overflow-hidden ${highlighted ? 'border-primary bg-white shadow-xl shadow-teal-900/10 ring-1 ring-primary/20 scale-[1.02]' : 'border-border bg-white'}`}>
                    {highlighted && <div className="absolute top-0 inset-x-0 h-1 bg-primary" />}
                    {highlighted && <span className="self-start mb-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">★ محبوب‌ترین</span>}
                    <h2 className="text-xl font-black flex items-center gap-2">{plan.name}<span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full">{plan.tier}</span></h2>
                    <p className="text-sm font-bold text-primary mt-1">{plan.description}</p>
                    {plan.longDescription && <p className="mt-2 text-xs text-muted-foreground leading-6">{plan.longDescription}</p>}
                    
                    <div className="mt-5 space-y-3">
                      {[
                        { label: '۱ ماهه', price: monthly, saving: null },
                        { label: '۳ ماهه', price: three, saving: `~ ${formatRial(monthly*3-three)} ت تخفیف` },
                        { label: '۱۲ ماهه', price: yearly, saving: `~ ${formatRial(monthly*12-yearly)} ت تخفیف` },
                      ].map((opt) => (
                        <div key={opt.label} className="flex items-center justify-between rounded-xl bg-slate-50 border border-border px-3 py-2.5">
                          <div>
                            <p className="text-xs font-bold">{opt.label}</p>
                            {opt.saving && <p className="text-[10px] text-green-700">{opt.saving}</p>}
                          </div>
                          <p className="text-sm font-black">{formatRial(opt.price)} <span className="text-[10px] font-normal text-muted-foreground">ت</span></p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-6 space-y-2.5 flex-1">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px]"><span className="text-primary mt-0.5">✓</span><span>{f}</span></li>
                      ))}
                    </ul>

                    <Link href={`/register?plan=${plan.code}`} className={`mt-8 inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors ${highlighted ? 'bg-primary text-white hover:bg-secondary shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      انتخاب {plan.name}
                    </Link>
                    <p className="text-[11px] text-center text-muted-foreground mt-3">۱۴ روز آزمایشی رایگان • بدون نیاز به کارت</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          <div className="mt-16 rounded-3xl bg-slate-900 text-white p-6 sm:p-10">
            <h3 className="text-xl font-black">سوالات؟</h3>
            <div className="mt-6 grid sm:grid-cols-2 gap-6 text-sm leading-7 text-slate-300">
              <div><p className="font-bold text-white">پیامک‌ها چطور محاسبه می‌شود؟</p><p className="mt-1">هر OTP، تأیید رزرو، یادآوری ۲۴س و ۲س یک پیامک محسوب می‌شود. در داشبورد مالک و سوپرادمین تعداد مصرفی نمایش داده می‌شود.</p></div>
              <div><p className="font-bold text-white">آیا می‌توانم پلن را عوض کنم؟</p><p className="mt-1">بله، از پنل کسب‌وکار → اشتراک، ارتقا/تنزل آنی انجام می‌شود. مابه‌التفاوت محاسبه می‌شود.</p></div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
