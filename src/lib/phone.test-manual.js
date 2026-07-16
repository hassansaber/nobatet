/**
 * تست دستی سریع normalizeIranPhone — اجرا:
 * node --experimental-default-type=module src/lib/phone.test-manual.js
 * یا از طریق import در REPL
 */
import { normalizeIranPhone, generateOtp, slugify } from './utils.js';

const cases = [
  ['09123456789', '09123456789'],
  ['9123456789', '09123456789'],
  ['+989123456789', '09123456789'],
  ['989123456789', '09123456789'],
  ['۰۹۱۲۳۴۵۶۷۸۹', '09123456789'],
  ['0912 345 6789', '09123456789'],
  ['123', null],
  ['', null],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = normalizeIranPhone(input);
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(ok ? '✓' : '✗', JSON.stringify(input), '→', got, expected !== got ? `(expected ${expected})` : '');
}

const otp = generateOtp(5);
console.log('otp length 5?', otp.length === 5, otp);
console.log('slugify', slugify('سالن زیبایی گل نرگس'));

process.exit(failed ? 1 : 0);
