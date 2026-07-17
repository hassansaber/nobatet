import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * ترکیب کلاس‌های Tailwind بدون conflict
 * @param {...import('clsx').ClassValue} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * نرمال‌سازی شماره موبایل ایرانی به فرمت 09xxxxxxxxx
 * (همان فرمت موردنیاز ملی‌پیامک)
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeIranPhone(input) {
  if (!input) return null;
  let phone = String(input).trim().replace(/[\s\-()]/g, '');

  // تبدیل اعداد فارسی/عربی به انگلیسی
  phone = phone
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`;
  if (phone.startsWith('0098')) phone = `0${phone.slice(4)}`;
  if (phone.startsWith('98') && phone.length === 12) phone = `0${phone.slice(2)}`;
  if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`;

  phone = phone.replace(/\D/g, '');
  if (phone.length === 10 && phone.startsWith('9')) phone = `0${phone}`;

  if (!/^09\d{9}$/.test(phone)) return null;
  return phone;
}

/**
 * تولید کد OTP عددی
 * @param {number} length
 */
export function generateOtp(length = 5) {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(Math.floor(min + Math.random() * (max - min)));
}

/**
 * فرمت مبلغ ریال به فارسی
 * @param {number} amount
 */
export function formatRial(amount) {
  return new Intl.NumberFormat('fa-IR').format(amount ?? 0);
}

/**
 * ساخت slug از متن فارسی/انگلیسی
 * @param {string} text
 */
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
