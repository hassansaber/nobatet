/**
 * ساخت URL ساب‌دامین تنانت (wildcard)
 * مثال: moribarber.business.nobatet.com
 * dev:   moribarber.business.localhost:3001
 */

/**
 * دامنه پایه بدون پروتکل — مثلا nobatet.com یا localhost:3001
 */
export function getBaseDomain() {
  return (
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ||
    'localhost:3001'
  );
}

/**
 * @param {'business' | 'visitor'} type
 * @param {string} slug
 * @param {string} [path]
 * @returns {string} absolute URL
 */
export function tenantUrl(type, slug, path = '/') {
  const base = getBaseDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const host = `${slug}.${type}.${base}`;
  const protocol = base.includes('localhost') || base.startsWith('127.')
    ? 'http'
    : 'https';
  return `${protocol}://${host}${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * لینک عمومی بیزنس
 * @param {string} slug
 * @param {string} [path]
 */
export function businessUrl(slug, path = '/') {
  return tenantUrl('business', slug, path);
}

/**
 * لینک عمومی ویزیتور
 * @param {string} slug
 * @param {string} [path]
 */
export function visitorUrl(slug, path = '/') {
  return tenantUrl('visitor', slug, path);
}

/**
 * فقط host بدون پروتکل — برای نمایش UI
 * @param {'business' | 'visitor'} type
 * @param {string} slug
 */
export function tenantHost(type, slug) {
  return `${slug}.${type}.${getBaseDomain()}`;
}
