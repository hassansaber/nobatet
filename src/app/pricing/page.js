import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/FadeIn';
import { formatRial } from '@/lib/utils';
import { listPlans, seedDefaultPlans } from '@/services/saas-service';

export const metadata = {
  title: 'قیمت‌گذاری',
};

export default async function PricingPage() {
  let plans = [];
  try {
    await seedDefaultPlans();
    plans = await listPlans({ publicOnly: true });
  } catch {
    plans = [];
  }

  // fallback if DB empty
  if (!plans.length) {
    plans = [
      {
        id: '1',
        name: 'شروع',
        code: 'starter',
        priceMonthly: 0,
        description: '۱۴ روز آزمایشی',
        maxStaff: 1,
        features: {},
      },
      {
        id: '2',
        name: 'حرفه‌ای',
        code: 'pro',
        priceMonthly: 490000,
        description: 'CRM + باشگاه + گزارش',
        maxStaff: 5,
        features: { crm: true, loyalty: true, reports: true },
      },
      {
        id: '3',
        name: 'سازمانی',
        code: 'business',
        priceMonthly: 990000,
        description: 'نامحدود + اولویت پشتیبانی',
        maxStaff: 100,
        features: { crm: true, loyalty: true, reports: true },
      },
    ];
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="text-center max-w-xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl font-black">
              پلن مناسب کسب‌وکارتان
            </h1>
            <p className="mt-3 text-muted-foreground">
              از آزمایش رایگان شروع کنید؛ هر وقت آماده بودید ارتقا دهید.
            </p>
          </FadeIn>

          <Stagger className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => {
              const highlighted = plan.code === 'pro' || i === 1;
              const features = [
                `${plan.maxStaff || '—'} کارمند`,
                plan.maxBookingsPerMonth
                  ? `${plan.maxBookingsPerMonth} نوبت / ماه`
                  : 'نوبت نامحدود',
                plan.features?.crm ? 'CRM پیشرفته' : 'CRM پایه',
                plan.features?.loyalty ? 'باشگاه مشتریان' : null,
                plan.features?.reports ? 'گزارش آماری' : null,
                plan.features?.customTheme ? 'تم اختصاصی' : 'لندینگ پایه',
                plan.features?.smsReminders ? 'یادآوری پیامکی' : null,
              ].filter(Boolean);

              return (
                <StaggerItem key={plan.id || plan.code}>
                  <div
                    className={`h-full rounded-2xl border p-6 flex flex-col ${
                      highlighted
                        ? 'border-primary bg-teal-50/50 shadow-lg shadow-teal-900/10 ring-1 ring-primary/20'
                        : 'border-border bg-white'
                    }`}
                  >
                    {highlighted && (
                      <span className="self-start mb-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
                        محبوب
                      </span>
                    )}
                    <h2 className="text-xl font-black">{plan.name}</h2>
                    <div className="mt-3">
                      <span className="text-3xl font-black">
                        {plan.priceMonthly === 0
                          ? 'رایگان'
                          : formatRial(plan.priceMonthly)}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-sm text-muted-foreground mr-1">
                          تومان / ماه
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                    <ul className="mt-6 space-y-2.5 flex-1">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/register"
                      className={`mt-8 inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                        highlighted
                          ? 'bg-primary text-white hover:bg-secondary'
                          : 'bg-white border border-border hover:bg-muted'
                      }`}
                    >
                      {plan.priceMonthly === 0 ? 'شروع آزمایشی' : 'انتخاب پلن'}
                    </Link>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </main>
    </>
  );
}
