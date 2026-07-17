import { z } from 'zod';
import { normalizeIranPhone } from './utils.js';

const phoneField = z
  .string({ message: 'شماره موبایل الزامی است' })
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizeIranPhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: 'custom',
        message: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)',
      });
      return z.NEVER;
    }
    return normalized;
  });

export const sendOtpSchema = z.object({
  phone: phoneField,
  purpose: z.enum(['login', 'register', 'reset_password']).default('login'),
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  code: z
    .string({ message: 'کد تأیید الزامی است' })
    .trim()
    .min(4, { message: 'کد تأیید نامعتبر است' })
    .max(6, { message: 'کد تأیید نامعتبر است' }),
  purpose: z.enum(['login', 'register', 'reset_password']).default('login'),
});

export const completeProfileSchema = z.object({
  phone: phoneField,
  firstName: z
    .string({ message: 'نام الزامی است' })
    .trim()
    .min(2, { message: 'نام حداقل ۲ حرف باشد' })
    .max(80),
  lastName: z
    .string({ message: 'نام خانوادگی الزامی است' })
    .trim()
    .min(2, { message: 'نام خانوادگی حداقل ۲ حرف باشد' })
    .max(80),
  password: z
    .string({ message: 'رمز عبور الزامی است' })
    .min(6, { message: 'رمز عبور حداقل ۶ کاراکتر باشد' })
    .max(72),
  role: z
    .enum(['customer', 'business_owner', 'visitor'])
    .default('customer'),
});

export const passwordLoginSchema = z.object({
  phone: phoneField,
  password: z.string({ message: 'رمز عبور الزامی است' }).min(1, {
    message: 'رمز عبور الزامی است',
  }),
});

export const resetPasswordSchema = z.object({
  phone: phoneField,
  code: z.string().trim().min(4).max(6),
  password: z
    .string()
    .min(6, { message: 'رمز عبور حداقل ۶ کاراکتر باشد' })
    .max(72),
});
