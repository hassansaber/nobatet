import { Vazirmatn, Inter } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: true,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: {
    default: 'نوبتت | نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی',
    template: '%s | نوبتت',
  },
  description:
    'پلتفرم نوبت‌دهی آنلاین چندمستأجری با CRM، تقویم شمسی و پنل مدیریتی — برای کلینیک، آرایشگاه، مطب و سالن زیبایی. رزرو بدون تداخل، پیامک خودکار، پرداخت آنلاین.',
  applicationName: 'نوبتت',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'نوبتت',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'نوبتت',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0284C7',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-background text-foreground">
        {/* Skip link for keyboard users - WCAG */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 z-[100] bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          پرش به محتوای اصلی
        </a>
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
