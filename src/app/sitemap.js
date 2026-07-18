export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nobatet.com';

  // Static routes
  const staticRoutes = [
    '',
    '/pricing',
    '/login',
    '/register',
    '/auth',
    '/demo',
    '/choose-workspace',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/pricing' ? 0.9 : 0.7,
  }));

  // Try to fetch businesses for dynamic sitemap (public businesses)
  let businessRoutes = [];
  try {
    // In build time, DATABASE_URL may not be available, so fallback to empty
    if (process.env.DATABASE_URL) {
      const { db } = await import('@/db/index.js');
      const { businesses } = await import('@/db/schema/businesses.js');
      const { eq } = await import('drizzle-orm');
      const rows = await db
        .select({ slug: businesses.slug, updatedAt: businesses.updatedAt })
        .from(businesses)
        .where(eq(businesses.isActive, true))
        .limit(100);

      businessRoutes = rows.map((b) => ({
        url: `https://${b.slug}.business.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nobatet.com'}`,
        lastModified: b.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (e) {
    // Ignore errors during build (e.g., no DB)
    console.warn('[sitemap] business fetch failed', e?.message);
  }

  return [...staticRoutes, ...businessRoutes];
}
