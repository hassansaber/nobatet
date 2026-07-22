# بررسی نهایی پروژه - باگ‌ها، ارورها، کد اضافی - فیکس‌ها

## تاریخ: 2026-07-22 - بعد از بازبینی کامل

### 1. باگ لندینگ `demo.localhost:3001` که هوم نشون میداد
**ریشه:** `RESERVED` شامل `demo` بود.
- `src/proxy.js` و `src/lib/slug-blocklist.js` هر دو `demo` را رزرو کرده بودند.
- `extractTenant('demo.localhost:3001')` => `null` => rewrite نمی‌شد => هوم.

**فیکس:**
- `demo`, `test`, `staging`, `dev`, `prod`, `production`, `testfa`, `nobatam` از لیست رزرو حذف شد (چون برای تست نیاز هستند)
- الان `demo.localhost:3001` => `{slug: demo}` ✅
- تست: `node -e` با RESERVED جدید => demo کار می‌کند.

### 2. صفحه ورود دو دکمه داشت
**درخواست:** اول فقط شماره + ادامه، بعد چک عضو جدید/قدیم.

**فیکس:**
- `src/components/auth/UnifiedAuth.js` کامل بازنویسی:
  - مرحله `phone`: فقط Input + دکمه ادامه
  - بعد از `POST /api/auth/otp/request` که `isNewUser` برمی‌گرداند:
    - اگر جدید => `otp` (ثبت‌نام)
    - اگر قدیمی => مرحله جدید `chooseMethod` با دو دکمه "ورود با کد پیامکی" و "ورود با رمز عبور"
  - حذف دکمه دوم از صفحه اول

### 3. Seed دمو فقط ۱ بیزنس داشت
**درخواست:** ۴-۵ کسب‌وکار + ۱۰۰ کاربر + تاریخچه متنوع

**فیکس:**
- فایل جدید `scripts/seed-realistic.js`:
  - ۵ بیزنس: `demo` (گل‌نرگس), `moristyle` (زنانه), `nailart` (ناخن), `barberking` (مردانه), `clinicnoor` (کلینیک)
  - هرکدام owner جدا `09120000001`..`05`
  - ۱۰۰ مشتری با اسم ایرانی رندوم + موبایل یکتا
  - ۱۵۰ رزرو (هر بیزنس ۳۰) با وضعیت‌های `confirmed, completed, cancelled, no_show, pending_payment, expired` و تاریخ ۶۰ روز گذشته تا ۱۴ روز آینده
  - لینک جدید تک سطحی: `http://moristyle.localhost:3001/`
- `package.json` script `db:seed:realistic` اضافه شد

### 4. کد اضافی و سنگینی
**حذف شده:**
- `src/lib/storage.js` (S3 abstraction که استفاده نمی‌شد - حالا همه دیتا روی هاست لوکال است برای cPanel ایران)
- `FIX_REPORT_FA.md`, `FINAL_FIX_REPORT.md`, `FINAL_COMPARISON_REPORT.md` قدیمی (فقط `IMPLEMENTATION_COMPLETE.md` و این فایل نگه داشته شد)
- `.next` (43M) پاک شد
- `public/uploads` خالی (4K) - چک شد

**نگه داشته شده (ضروری):**
- `src/lib/cors.js` (امنیت)
- `src/lib/slug-blocklist.js` (امنیت)
- `src/db/schema/auth.js` (refresh tokens)
- `docs/CPANEL_DEPLOY.md` (ضروری برای هاست اشتراکی)

### 5. باگ‌های Lint و Syntax
- `WaitlistManager.js` - `"` داخل متن فارسی باعث `react/no-unescaped-entities` - به جمله بدون نقل قول تغییر کرد
- `SettingsForm.js` و `DomainManager.js` - کاراکتر `>` داخل JSX متن باعث parse error - به `→` تغییر کرد
- Build الان `✓ Compiled successfully` بدون ارور

### 6. PWA قدیمی
**فیکس:**
- `public/sw.js` v4 → v5: `skipWaiting` پیام, stale-while-revalidate, مناسب cPanel
- `ServiceWorkerRegister.js`: update هر 60s + controllerchange reload + unregister در dev
- `manifest.js`: `id`, `launch_handler`, `screenshots`, `shortcuts` جدید
- `offline.html`: UI جدید با تلاش خودکار آنلاین + hint cPanel

### 7. cPanel Node 24 Architecture
- `next.config.js`: `output: standalone?`, `serverComponentsExternalPackages: ['sharp']`, headers برای sw.js
- `server.js`: Startup file برای cPanel
- `src/app/api/upload/route.js`: آپلود لوکال + چک writability - مناسب هاست اشتراکی (بدون S3)
- `sitemap.js`: `revalidate=3600` + `dynamic=force-dynamic` - دیگر در بیلد بدون DB fail نمی‌شود
- `docs/CPANEL_DEPLOY.md` کامل

### 8. فیچرهای باقی‌مانده (طبق درخواست: همه بجز ایمیل و AI)
- BookingWizard 3 مرحله‌ای با draft, smart defaults, fallback, waitlist join
- BusinessRecentAndQuickAdd + POST /api/business/bookings برای رزرو حضوری
- OnboardingWizard 3 قدم
- Settings Tabs + Autosave
- Waitlist (جدول + API + صفحه + داخل wizard)
- Gift Cards (جدول + API + صفحه)
- Invites RBAC (جدول + API + صفحه /invite/[token])
- Custom Domain UI (تب + صفحه /business/domain)
- Instagram tab

### 9. بررسی نهایی Build
```bash
npm run build
✓ Compiled successfully in 14.5s
ƒ /api/auth/refresh
ƒ /business/domain
ƒ /business/gift-cards
ƒ /business/invites
ƒ /business/waitlist
ƒ /invite/[token]
ƒ /sites/[type]/[slug] -> moristyle.nobatet.com
```

### 10. چک نهایی لینک‌ها قدیمی
- `grep -Rn "business\.nobatet.com"` فقط در کامنت‌های "قبلاً ... بوده" مانده (برای مستندسازی) - در کد اجرایی نیست
- تمام لینک‌های کاربری الان تک سطحی: `moristyle.nobatet.com`

پروژه الان lean، بدون کد اضافی، بدون ارور، آماده دیپلوی cPanel Node 24 ایران.
