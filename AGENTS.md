<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# نوبتت (Nobatet) — Project Context for Coding Agents

> این فایل باید قبل از پیاده‌سازی هر فیچر ایندکس شود.
> جزئیات کامل محصول در `PROJECT_CONTEXT.md` است.

## محصول

پلتفرم SaaS چندمستأجری نوبت‌دهی + CRM برای کسب‌وکارهای ایرانی.
هدف اصلی: **نوبت‌دهی هوشمند و بدون تداخل زمانی**.

## استک

- Next.js (App Router) + React — **JavaScript only (بدون TypeScript)**
- Tailwind CSS — Mobile First + RTL کامل
- PostgreSQL + Drizzle ORM
- JWT (httpOnly Cookie) + OTP موبایل ایرانی
- ملی‌پیامک (SOAP) — `services/sms.js`
- پرداخت: Sandbox gateway + کارت‌به‌کارت دستی
- Hosting: Liara
- **Next.js 16:** Middleware → **Proxy** (`src/proxy.js`)

## قوانین حیاتی

1. هیچ secretی hardcode نشود — فقط `.env`
2. پکیج‌ها را pin نکن؛ آخرین نسخه پایدار
3. تقویم جلالی در تمام UI تاریخ
4. احراز هویت فقط با موبایل ایرانی (OTP + رمز عبور)
5. موتور رزرو: Slot Locking + Buffer + جلوگیری از تداخل
6. قبل از هر فیچر: best practice رسمی Next/Drizzle را از docs بخوان
7. Schema مرکزی: `src/db/index.js` همه schemaها را export کند
8. فایل‌های حساس هرگز commit نشوند

## نقش‌ها (RBAC)

`super_admin` | `visitor` | `business_owner` | `staff` | `customer`

تک‌جدول users با فیلد `role` (و پشتیبانی multi-role از طریق membership).

## ساختار پوشه‌ها (مرجع)

```
src/
  app/                  # App Router pages
    (public)/           # لندینگ، قیمت، ورود
    (auth)/             # فلوی OTP
    (dashboard)/        # پنل‌ها بر اساس نقش
    sites/[type]/[slug]/ # لندینگ تنانت (rewrite از subdomain؛ _sites خصوصی Next است)
    api/                # Route handlers
  components/           # UI مشترک
  db/                   # Drizzle schema + client
  lib/                  # utils, auth, validators
  services/             # sms, payment, booking-engine
  proxy.js              # Subdomain + auth checks (Next 16)
```

## فاز فعلی

فاز ۶ انجام‌شده — PWA + polish + demo + Liara deploy ready (محصول کامل MVP)

### SMS (ملی‌پیامک)

- SMS همیشه واقعی (ملی‌پیامک) — mock حذف شده
- REST + SOAP fallback: `SendByBaseNumber`
- `to` همیشه `09xxxxxxxxx` نرمال می‌شود
- `username` / `password=API Key` / `bodyId` فقط از `.env`
- recId ≥ ۱۵ رقم = موفق · جدول خطا در `src/services/sms.js`
- فقط OTP bodyId الان ست است؛ بقیه پترن‌ها skip می‌شوند تا bodyId اضافه شود
- لینک بیزنس: `{slug}.business.{BASE_DOMAIN}` (wildcard)

### پرداخت

- `src/services/payment.js` — sandbox gateway + card_to_card review
- UI: `/pay/sandbox` · `/pay/result` · `/business/payments`
- قفل کارت‌به‌کارت: `SLOT_LOCK_CARD_TO_CARD_MINUTES` (پیش‌فرض ۱۸۰)

### Next.js 16 docs (ایندکس‌شده)

- Middleware → **Proxy** (`src/proxy.js`)
- Route Handlers: `app/**/route.js` — GET/POST/...
- Server Actions: `'use server'` + auth داخل هر action
- env فقط از ریشه پروژه؛ secrets در `.env` (gitignored)
- پوشه `_folder` خصوصی است → tenant path = `/sites/[type]/[slug]`

## Pre-deploy (Liara)

```bash
drizzle-kit generate
# package.json: "migrate": "drizzle-kit migrate"
# liara_pre_build.sh → npm run migrate
```
