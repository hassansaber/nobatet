/**
 * لیست اسلاگ‌های رزرو شده - نباید به عنوان tenant slug استفاده شوند
 * شامل: زیرساخت، ادمین، کلمات زشت فارسی/انگلیسی، برندها
 */
export const RESERVED_SLUGS = new Set([
  // زیرساخت
  'www', 'api', 'app', 'admin', 'dashboard', 'panel', 'root', 'system', 'internal',
  'business', 'visitor', 'auth', 'login', 'register', 'logout', 'me', 'choose-workspace',
  'demo', 'test', 'staging', 'dev', 'prod', 'production',
  'mail', 'email', 'smtp', 'ftp', 'sftp', 'ssh', 'vpn', 'ns1', 'ns2',
  'cdn', 'assets', 'static', 'public', 'private', 'images', 'img', 'js', 'css',
  'blog', 'docs', 'help', 'support', 'status', 'health', 'uptime',
  'billing', 'payment', 'pay', 'checkout', 'subscription', 'pricing', 'plans',
  'abuse', 'security', 'legal', 'privacy', 'terms', 'contact', 'about',
  'account', 'accounts', 'user', 'users', 'profile', 'settings',
  // فارسی رزرو
  'modir', 'admin-fa', 'testfa',
  // برند نوبتت
  'nobatet', 'nobat', 'nobatam',
  // عمومی
  'null', 'undefined', 'true', 'false', 'nil',
]);

// کلمات زشت - نمونه کوتاه، در پروداکشن لیست کامل تر بگذار
export const PROFANITY_SLUGS = new Set([
  // انگلیسی نمونه - در پروداکشن از پکیج bad-words استفاده کن
  'fuck', 'shit', 'ass', 'sex', 'porn', 'xxx',
  // فارسی - با احترام، فقط نمونه، لیست واقعی را از دیتابیس یا سرویس بگیر
  // اینجا خالی می‌گذاریم تا سانسور نشود ولی در عمل باید چک شود
]);

export function isReservedSlug(slug) {
  if (!slug) return true;
  const normalized = slug.toLowerCase().trim();
  if (normalized.length < 3) return true; // حداقل 3 کاراکتر
  if (normalized.length > 30) return true;
  if (!/^[a-z0-9-]+$/.test(normalized)) return true; // فقط انگلیسی کوچک، عدد، خط تیره - برای سابدامین
  // جداگانه برای فارسی هم می‌توان اسلاگ را transliterate کرد ولی برای سابدامین فقط ascii مجاز است
  if (RESERVED_SLUGS.has(normalized)) return true;
  if (PROFANITY_SLUGS.has(normalized)) return true;
  if (normalized.startsWith('-') || normalized.endsWith('-')) return true;
  if (normalized.includes('--')) return true;
  return false;
}

export function validateAndNormalizeSlug(input) {
  if (!input) return { ok: false, error: 'اسلاگ الزامی است' };
  let slug = String(input).trim().toLowerCase();
  // تبدیل فاصله و آندرلاین به خط تیره
  slug = slug.replace(/[\s_]+/g, '-');
  // حذف کاراکترهای غیرمجاز به جز a-z 0-9 -
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (slug.length < 3) return { ok: false, error: 'اسلاگ باید حداقل 3 کاراکتر باشد' };
  if (slug.length > 30) return { ok: false, error: 'اسلاگ حداکثر 30 کاراکتر' };
  if (isReservedSlug(slug)) return { ok: false, error: `اسلاگ "${slug}" رزرو شده است` };
  
  return { ok: true, slug };
}
