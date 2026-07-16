/**
 * زمان‌بندی یکپارچه بر اساس Asia/Tehran
 * مشکل: Docker/Node معمولاً UTC است؛ new Date(y,m,d,h,mi) ساعت محلی سرور می‌سازد.
 */

export const APP_TZ = 'Asia/Tehran';
/** ایران بدون DST فعلی: UTC+03:30 */
export const IRAN_OFFSET = '+03:30';

/**
 * YYYY-MM-DD + HH:mm → Date مطلق (دیوارساعت تهران)
 * @param {string} dateStr
 * @param {string} hhmm
 */
export function combineIranDateTime(dateStr, hhmm) {
  const [h, mi] = String(hhmm).split(':').map(Number);
  const hh = String(h).padStart(2, '0');
  const mm = String(mi || 0).padStart(2, '0');
  // ISO با offset صریح — مستقل از TZ سرور
  return new Date(`${dateStr}T${hh}:${mm}:00${IRAN_OFFSET}`);
}

/**
 * نمایش ساعت به وقت تهران
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} [opts]
 */
export function formatTehran(date, opts = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('fa-IR', { timeZone: APP_TZ, ...opts });
}

/**
 * فقط ساعت HH:mm به وقت تهران (برای دکمه‌ها)
 * @param {Date|string|number} date
 */
export function formatTehranTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  // en-GB gives 24h HH:mm
  return d.toLocaleTimeString('en-GB', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * تاریخ+ساعت فارسی تهران
 */
export function formatTehranDateTime(date) {
  return formatTehran(date, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * الان به وقت تهران به‌صورت Date قابل مقایسه
 */
export function nowTehran() {
  return new Date();
}

/**
 * YYYY-MM-DD امروز تهران
 */
export function todayTehranDateStr() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/**
 * dayOfWeek تهران: 0=شنبه ... 6=جمعه
 * @param {Date} date
 */
export function tehranDayOfWeek(date) {
  // weekday short in en, map
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TZ,
    weekday: 'short',
  }).format(date);
  // Sat=0 ... Fri=6 for Iranian week
  const map = { Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 };
  return map[wd] ?? 0;
}
