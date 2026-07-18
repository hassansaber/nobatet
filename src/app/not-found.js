import Link from 'next/link';
import { Search, Home, Sparkles, LogIn, MapPin } from 'lucide-react';

export const metadata = { title: 'صفحه یافت نشد | نوبتت' };

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative text-center max-w-lg w-full">
        <div className="relative mx-auto mb-8">
          <div className="text-[120px] sm:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-cyan-600 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-20 rounded-2xl bg-white shadow-xl border flex items-center justify-center animate-bounce">
              <Search className="size-10 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
          صفحه مورد نظر یافت نشد
        </h1>
        <p className="text-base text-slate-600 leading-8 mb-8">
          به نظر می‌رسد آدرسی که وارد کرده‌اید اشتباه است یا صفحه حذف شده.
          نگران نباشید، ما شما را برمی‌گردانیم.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-secondary transition-all hover:-translate-y-0.5 cursor-pointer">
            <Home className="size-4" />
            بازگشت به خانه
          </Link>
          <Link href="/pricing" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 text-base font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <MapPin className="size-4" />
            مشاهده قیمت‌ها
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { Icon: Home, label: 'صفحه اصلی', href: '/' },
            { Icon: Sparkles, label: 'شروع رایگان', href: '/register' },
            { Icon: LogIn, label: 'ورود', href: '/login' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="rounded-2xl border border-border/50 bg-white/60 p-4 backdrop-blur hover:bg-white hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
              <div className="mx-auto size-9 rounded-xl bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <item.Icon className="size-5 text-slate-700 group-hover:text-primary" />
              </div>
              <div className="text-xs font-bold text-slate-700 mt-2">{item.label}</div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-400">
          کد خطا: NOT_FOUND • اگر فکر می‌کنید این یک باگ است با پشتیبانی تماس بگیرید
        </p>
      </div>
    </div>
  );
}
