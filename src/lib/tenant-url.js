/**
 * ساخت URL ساب‌دامین تنانت (wildcard) - نسخه جدید ساده شده
 * قدیم: moribarber.business.nobatet.com (دو سطح - نیاز به دو wildcard cert)
 * جدید: moribarber.nobatet.com (تک سطح - یک wildcard cert کافیست *.nobatet.com)
 * 
 * برای سازگاری، تابع type را نادیده می‌گیرد و فقط slug + base را برمی‌گرداند
 * تشخیص business vs visitor در صفحه لندینگ با جستجوی DB انجام می‌شود
 */

/**
 * دامنه پایه بدون پروتکل — مثلا nobatet.com یا localhost:3001
 */
export function getBaseDomain() {
  return (
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\/.*/, '')?.replace(/^https?:\/\//, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ||
    'localhost:3001'
  );
}

/**
 * @param {'business' | 'visitor'} type - دیگر استفاده نمی‌شود، برای سازگاری نگه داشته شده
 * @param {string} slug
 * @param {string} [path]
 * @returns {string} absolute URL like https://moristyle.nobatet.com
 */
export function tenantUrl(type, slug, path = '/') {
  const base = getBaseDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // نسخه جدید: فقط slug.base - بدون .business وسط
  const host = `${slug}.${base}`;
  const protocol = base.includes('localhost') || base.startsWith('127.') || base.includes('lvh.me')
    ? 'http'
    : 'https';
  return `${protocol}://${host}${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * لینک عمومی بیزنس - نسخه جدید تک سطحی
 * @param {string} slug
 * @param {string} [path]
 */
export function businessUrl(slug, path = '/') {
  return tenantUrl('business', slug, path);
}

/**
 * لینک عمومی ویزیتور - نسخه جدید تک سطحی (همان دامنه، تشخیص از DB)
 * @param {string} slug
 * @param {string} [path]
 */
export function visitorUrl(slug, path = '/') {
  return tenantUrl('visitor', slug, path);
}

/**
 * فقط host بدون پروتکل — برای نمایش UI
 * @param {'business' | 'visitor'} type - نادیده گرفته می‌شود
 * @param {string} slug
 */
export function tenantHost(type, slug) {
  return `${slug}.${getBaseDomain()}`;
}

/**
 * ساخت URL قدیمی برای سازگاری و ریدایرکت (اگر نیاز بود)
 * @deprecated
 */
export function legacyBusinessUrl(slug, path = '/') {
  const base = getBaseDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const host = `${slug}.business.${base}`;
  const protocol = base.includes('localhost') || base.startsWith('127.') ? 'http' : 'https';
  return `${protocol}://${host}${cleanPath === '/' ? '' : cleanPath}`;
}

export function legacyVisitorUrl(slug, path = '/') {
  const base = getBaseDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const host = `${slug}.visitor.${base}`;
  const protocol = base.includes('localhost') || base.startsWith('127.') ? 'http' : 'https';
  return `${protocol}://${host}${cleanPath === '/' ? '' : cleanPath}`;
}
