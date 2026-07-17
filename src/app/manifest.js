export default function manifest() {
  return {
    name: 'نوبتت',
    short_name: 'نوبتت',
    description:
      'نوبت‌دهی هوشمند برای کسب‌وکارهای ایرانی — کلینیک، آرایشگاه، مطب و سالن',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f8fafc',
    theme_color: '#0d9488',
    lang: 'fa',
    dir: 'rtl',
    categories: ['business', 'productivity'],
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
        url: '/login',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'دمو',
        short_name: 'دمو',
        url: '/demo',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'نوبت‌های من',
        short_name: 'نوبت‌ها',
        url: '/me',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
