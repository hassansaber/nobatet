export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nobatet.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/business/', '/staff/', '/visitor/', '/api/', '/me/', '/choose-workspace', '/pay/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/business/', '/staff/', '/visitor/', '/api/', '/me/', '/choose-workspace'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
