/**
 * ابزارهای تاریخ جلالی — لایه نازک روی date-fns-jalali
 * همه UIهای تاریخ باید از اینجا استفاده کنند.
 */

import {
  format as formatJalali,
  parse as parseJalali,
  addDays,
  startOfDay,
  isBefore,
  isAfter,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

/**
 * @param {Date | number | string} date
 * @param {string} pattern - مثلا yyyy/MM/dd یا HH:mm
 */
export function formatFa(date, pattern = 'yyyy/MM/dd') {
  const d = date instanceof Date ? date : new Date(date);
  return formatJalali(d, pattern, { locale: faIR });
}

/**
 * نمایش تاریخ+ساعت فارسی
 * @param {Date | number | string} date
 */
export function formatFaDateTime(date) {
  return formatFa(date, 'yyyy/MM/dd — HH:mm');
}

/**
 * @param {string} value - yyyy/MM/dd
 * @param {Date} [reference]
 */
export function parseFaDate(value, reference = new Date()) {
  return parseJalali(value, 'yyyy/MM/dd', reference);
}

export { addDays, startOfDay, isBefore, isAfter };
