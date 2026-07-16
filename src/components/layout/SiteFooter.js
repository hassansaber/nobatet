import Link from 'next/link';
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-icon.png"
                alt="نوبتت"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <span className="text-lg font-black text-white">نوبتت</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400 max-w-xs">
              پلتفرم نوبت‌دهی چندمستأجری برای کسب‌وکارهای ایرانی — رزرو آنلاین،
              CRM، پیامک و پرداخت در یکجا.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-white mb-3">محصول</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#features" className="hover:text-teal-300 transition-colors">
                  امکانات
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-teal-300 transition-colors">
                  قیمت‌گذاری
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-teal-300 transition-colors">
                  دمو تعاملی
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white mb-3">شروع کار</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-teal-300 transition-colors">
                  ثبت‌نام رایگان
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-300 transition-colors">
                  ورود
                </Link>
              </li>
              <li>
                <Link href="/#how" className="hover:text-teal-300 transition-colors">
                  راهنمای شروع
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white mb-3">مناسب برای</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>سالن زیبایی و آرایشگاه</li>
              <li>کلینیک و مطب</li>
              <li>باشگاه و مرکز خدمات</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} نوبتت — همه حقوق محفوظ است</p>
          <p className="text-slate-600">ساخته‌شده برای کسب‌وکار ایرانی · RTL · Mobile First</p>
        </div>
      </div>
    </footer>
  );
}
