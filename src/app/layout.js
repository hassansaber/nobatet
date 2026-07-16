import { Vazirmatn } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'نوبتت | نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی',
    template: '%s | نوبتت',
  },
  description:
    'پلتفرم نوبت‌دهی آنلاین چندمستأجری با CRM، تقویم شمسی و پنل مدیریتی — برای کلینیک، آرایشگاه، مطب و سالن زیبایی',
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
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d9488',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
