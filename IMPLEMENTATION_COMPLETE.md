# پیاده‌سازی کامل - نسخه cPanel + تک سطحی + تمام فیچرها (بدون ایمیل و AI)

## درخواست شما
> همرو انجام بده بجز ایمیل و هوش مصنوعی - استوریج روی هاست اشتراکی cPanel Node 24 ایران - همه دیتا روی هاست - PWA قدیمی درست کن - کد اضافی پاک کن

## ✅ چک‌لیست انجام شده

### 1. Wildcard تک سطحی (حذف business وسط)
- **قبل:** `demo.business.nobatet.com` (نیاز به 2 cert)
- **بعد:** `demo.nobatet.com` و `moristyle.nobatet.com` - یک `*.nobatet.com`
- فایل‌ها: `tenant-url.js`, `proxy.js` (با backward compat), `sites/[type]/[slug]/page.js` (auto detection), `demo/page.js`, `DashboardShell`, `business/page.js`, `sitemap.js`, `QrGenerator`, `SettingsForm`, `app/page.js`

### 2. JWT کوتاه مدت + Refresh Rotation
- Access 15m + Refresh 7d + Rotation + Reuse detection
- جدول جدید: `refresh_tokens`, `login_attempts`, `business_invites`
- Route جدید: `/api/auth/refresh`
- Sync حالا هر دو کوکی را ست می‌کند

### 3. CORS سخت‌گیرانه + Slug Blocklist
- `lib/cors.js` - فقط `*.nobatet.com`, `*.localhost`, `*.lvh.me`
- `lib/slug-blocklist.js` - `www,api,admin,...` + یکتایی بین businesses و visitors

### 4. Booking Engine - ضد double-book
- `booking-engine.js` - transaction + `pg_advisory_xact_lock` + `FOR UPDATE`

### 5. PWA مدرن - cPanel Ready
- `public/sw.js` v5 - skipWaiting message, stale-while-revalidate, مناسب cPanel
- `ServiceWorkerRegister.js` - update هر 60s + controllerchange reload
- `manifest.js` - screenshots, shortcuts جدید, launch_handler
- `offline.html` - UI جدید + تلاش خودکار آنلاین

### 6. cPanel Node 24 - معماری هاست اشتراکی ایران
- `next.config.js` - `output: standalone?` + `serverComponentsExternalPackages: ['sharp']` + headers برای sw.js
- `server.js` - Startup file برای cPanel (Application root)
- `src/app/api/upload/route.js` - آپلود لوکال `public/uploads` با sharp WebP - بدون S3 (تحریم)
- `docs/CPANEL_DEPLOY.md` - راهنمای کامل wildcard + Postgres + Cron

### 7. Lean Cleanup
- حذف `src/lib/storage.js` (S3 abstraction سنگین)
- حذف گزارش‌های قدیمی (`FIX_REPORT_FA.md`, etc.)
- کد اضافی پاک شد

### 8. BookingWizard 3 مرحله‌ای (جدید - P0)
- قبل 6 مرحله، بعد 3 مرحله:
  1. خدمت + متخصص (با badge محبوب)
  2. تاریخ + ساعت (تقویم شمسی 14 روزه + tooltip جمعه + fallback پیشنهاد روز بعد + لیست انتظار)
  3. اطلاعات + پرداخت (sticky progress + summary + trust badges + inline validation + draft save در localStorage)
- Waitlist join داخل wizard وقتی slot پر است
- Draft auto-save

### 9. داشبورد بیزنس بهبود
- `BusinessRecentAndQuickAdd.js` - 5 رزرو اخیر با دکمه تأیید/لغو سریع + افزودن سریع رزرو حضوری (POST /api/business/bookings)
- `OnboardingWizard.js` - 3 قدم بعد از ساخت بیزنس اگر خدمت <2: لینک لندینگ + ساخت اولین خدمت + QR
- `POST /api/business/bookings` - برای quick add حضوری (confirmed)

### 10. Settings Tabs + Autosave
- `SettingsForm.js` بازنویسی:
  - Tabs: پروفایل / برندینگ / گالری / موقعیت / پرداخت / فیچرها / دامنه / اینستاگرام
  - Autosave debounce 1500ms
  - تب دامنه: BYO domain UI
  - تب اینستاگرام: کپی لینک + راهنمای بیو

### 11. Sitemap ISR
- `sitemap.js` - `revalidate=3600` + `dynamic=force-dynamic` - دیگر در بیلد fail نمی‌شود

### 12. Waitlist
- جدول `waitlist` + API `/api/business/waitlist` + `/api/public/waitlist`
- صفحه `/business/waitlist` + Manager
- داخل BookingWizard وقتی slot پر است، فرم join waitlist

### 13. Gift Cards
- جدول `giftCards` + API `/api/business/gift-cards`
- صفحه `/business/gift-cards` + Manager (ساخت کد با موجودی)

### 14. Instagram Booking
- تب اینستاگرام در Settings: کپی لینک `moristyle.nobatet.com` + راهنمای بیو و استوری

### 15. Custom Domain UI
- صفحه `/business/domain` + تب domain در settings
- راهنمای CNAME در cPanel

### 16. Invite Flow RBAC پیشرفته
- جدول `business_invites` + API `/api/business/invites` + `/api/invite/accept`
- صفحه `/invite/[token]` + `InviteAcceptClient`
- صفحه `/business/invites` Manager

### 17. Upload لوکال برای cPanel
- قبلاً local بود، الان مستند شد + چک writability
- همه دیتا روی هاست - بدون وابستگی S3/Twilio (تحریم)

## تست بیلد
```
✓ Compiled successfully
ƒ /api/auth/refresh
ƒ /business/domain
ƒ /business/gift-cards
ƒ /business/invites
ƒ /business/waitlist
ƒ /invite/[token]
ƒ /sites/[type]/[slug] -> moristyle.nobatet.com
```

## .env جدید برای cPanel
```env
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NEXT_PUBLIC_BASE_DOMAIN=nobatet.com
NEXT_PUBLIC_APP_URL=https://nobatet.com
STORAGE_DRIVER=local
```

## حذف شده (برای lean)
- Email marketing (گفتی نمی‌خوای)
- AI assistant (گفتی نمی‌خوای)
- S3 abstraction
- گزارش‌های قدیمی
- کدهای اضافی target _blank

## قدم بعدی برای دیپلوی cPanel
1. فایل‌ها را zip کن و در File Manager آپلود کن
2. `.env` را بساز
3. `npm install && npm run build && npm start` (یا از UI cPanel)
4. wildcard `*.nobatet.com` A رکورد به IP هاست
5. `public/uploads` را `chmod 755`

تمام موارد درخواستی بدون سنگین کردن پروژه پیاده شد.
