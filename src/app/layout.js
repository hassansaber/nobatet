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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nobatet.com';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nobatet.com';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'نوبتت | نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی',
    template: '%s | نوبتت',
  },
  description:
    'پلتفرم نوبت‌دهی آنلاین چندمستأجری با CRM، باشگاه مشتریان، تقویم شمسی، پیامک خودکار و پرداخت آنلاین — برای سالن زیبایی، کلینیک، آرایشگاه، مطب و باشگاه. رزرو بدون تداخل، ساب‌دامین اختصاصی، PWA.',
  applicationName: 'نوبتت',
  keywords: [
    'نوبت دهی',
    'نوبت دهی آنلاین',
    'رزرو آنلاین',
    'نوبتت',
    'سالن زیبایی',
    'آرایشگاه',
    'کلینیک',
    'مطب',
    'باشگاه',
    'CRM',
    'تقویم شمسی',
    'مدیریت نوبت',
    'SaaS',
    'booking',
    'appointment',
  ],
  authors: [{ name: 'نوبتت', url: APP_URL }],
  creator: 'نوبتت',
  publisher: 'نوبتت',
  category: 'Business',
  classification: 'Booking SaaS',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'fa-IR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: APP_URL,
    siteName: 'نوبتت',
    title: 'نوبتت | نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی',
    description:
      'رزرو آنلاین بدون تداخل زمانی، CRM، باشگاه مشتریان، پیامک خودکار، پرداخت آنلاین و ساب‌دامین اختصاصی — همه در یک پلتفرم فارسی و Mobile First.',
    images: [
      {
        url: '/images/hero-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'نوبتت - نوبت‌دهی هوشمند',
      },
      {
        url: '/logo-icon.png',
        width: 512,
        height: 512,
        alt: 'لوگوی نوبتت',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نوبتت | نوبت‌دهی هوشمند',
    description: 'پلتفرم نوبت‌دهی آنلاین با CRM و تقویم شمسی — بدون تداخل زمانی، با پیامک خودکار',
    images: ['/images/hero-banner.jpg'],
    creator: '@nobatet',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'نوبتت',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  verification: {
    // اضافه کن اگر داری: google, yandex, etc
    // google: 'your-google-verification-code',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0284C7',
  colorScheme: 'light',
};

const jsonLdWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'نوبتت',
  alternateName: 'Nobatet',
  url: APP_URL,
  description: 'پلتفرم نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی',
  inLanguage: 'fa-IR',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${APP_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'نوبتت',
  url: APP_URL,
  logo: `${APP_URL}/logo-icon.png`,
  description: 'پلتفرم SaaS نوبت‌دهی + CRM برای کسب‌وکارهای ایرانی',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['fa', 'en'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${inter.variable} h-full scroll-smooth`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-background text-foreground">
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
