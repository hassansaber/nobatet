export default function manifest() {
  return {
    id: '/',
    name: 'نوبتت - نوبت‌دهی هوشمند',
    short_name: 'نوبتت',
    description:
      'نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی — کلینیک، آرایشگاه، مطب و سالن زیبایی. رزرو بدون تداخل، CRM، پرداخت آنلاین، ساب‌دامین اختصاصی moristyle.nobatet.com',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'browser'],
    orientation: 'portrait-primary',
    background_color: '#f8fafc',
    theme_color: '#0284C7',
    lang: 'fa',
    dir: 'rtl',
    categories: ['business', 'productivity', 'lifestyle'],
    launch_handler: { client_mode: 'navigate-existing' },
    handle_links: 'preferred',
    edge_side_panel: { preferred_width: 400 },
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'ورود',
        short_name: 'ورود',
        description: 'ورود به حساب',
        url: '/login',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'دمو',
        short_name: 'دمو',
        description: 'مشاهده دموی تعاملی',
        url: '/demo',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'نوبت‌های من',
        short_name: 'نوبت‌ها',
        description: 'تاریخچه رزروها',
        url: '/me',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'داشبورد بیزنس',
        short_name: 'بیزنس',
        description: 'مدیریت کسب‌وکار',
        url: '/business',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [
      {
        src: '/images/hero-banner.jpg',
        sizes: '1200x630',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'نوبتت - صفحه اصلی',
      },
    ],
  };
}
