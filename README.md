# نوبتت (Nobatet) — پلتفرم SaaS نوبت‌دهی هوشمند

پلتفرم چندمستأجری (Multi-Tenant) نوبت‌دهی + CRM + حسابداری + باشگاه مشتریان برای کسب‌وکارهای ایرانی — سالن زیبایی، کلینیک، آرایشگاه، مطب، باشگاه و...

> ✨ **فاز نهایی پولیش شده** — Mobile First، RTL کامل، تقویم شمسی، پیامک واقعی، آپلود بهینه، تعطیلات رسمی، داشبوردهای حرفه‌ای

---

## 🚀 ویژگی‌ها

- **موتور رزرو بدون تداخل**: Slot Locking (۱۰ دقیقه آنلاین / ۱۸۰ دقیقه کارت‌به‌کارت) + Buffer Time + جلوگیری از Double-Booking
- **Multi-Tenant**: هر بیزنس ساب‌دامین اختصاصی `slug.business.nobatet.com` با تم رنگی، لوگو، بنر، گالری تصویر/ویدیو، نقشه
- **احراز هویت موبایلی**: OTP پیامکی ملی‌پیامک + رمز عبور، یک شماره = چند نقش (owner در یک بیزنس، staff در بیزنس دیگر، مشتری جای دیگر)
- **RBAC پیشرفته**: `business_members` منبع حقیقت، `user_roles` برای نقش‌های سراسری (super_admin, visitor)، JWT با `globalRoles[] + memberships[]` و `token_version` برای invalidation بی‌صدا
- **پرداخت**: درگاه Sandbox + کارت‌به‌کارت با ثبت ۴ رقم آخر، شماره پیگیری، توضیحات تراکنش (شماره، تاریخ، بانک)
- **پیامک**: ملی‌پیامک واقعی (OTP، تأیید رزرو، یادآوری ۲۴س/۲س، کارت‌به‌کارت) + لاگ مصرف در `sms_logs`
- **آپلود داخلی**: `POST /api/upload` — تصاویر به WebP بهینه می‌شوند (avatar 400، logo 512، banner 1280، gallery 1024) + ویدیو mp4/webm تا ۵۰MB در `/public/uploads/{type}/`
- **تعطیلات رسمی ایران**: ۱۴۰۳/۱۴۰۴/۱۴۰۵ در `src/lib/iranianHolidays.js` — افزودن یک‌کلیکی یا دسته‌جمعی به تقویم کسب‌وکار
- **داشبوردهای حرفه‌ای**: نمودارهای Bar, Donut, Line بدون کتابخانه خارجی — بیزنس (درآمد، وضعیت رزرو، خدمات، هزینه‌ها، پیامک، سود/زیان)، ادمین (رشد، اشتراک، SMS)، ویزیتور، کارمند، مشتری
- **حسابداری کوچک**: ثبت هزینه‌ها (اجاره، حقوق، خرید، تبلیغات، قبوض) + گزارش دسته‌ای + CSV
- **QR کد**: تولید QR لندینگ در `/business/qr` و تنظیمات، قابل چاپ
- **PWA**: `manifest.js` + `sw.js` + `offline.html`

---

## 🐳 اجرا با Docker (پیشنهادی)

```bash
docker compose up -d --build
# → http://localhost:3001
# دمو: http://demo.business.localhost:3001
```

---

## 💻 توسعه محلی

```bash
cp .env.example .env
# .env را با اطلاعات دیتابیس و JWT و ملی‌پیامک پر کن

npm install
npm run db:push      # یا db:generate + db:migrate
npm run db:seed      # ساخت ۵ حساب تستی + بیزنس دمو
npm run dev          # → http://localhost:3001
```

---

## 👥 حساب‌های Seed

| نقش | موبایل | رمز | داشبورد | توضیح |
|-----|--------|-----|----------|--------|
| Super Admin | 09120000000 | 123456 | `/admin` | دسترسی کل پلتفرم |
| Owner | 09120000001 | 123456 | `/business` | صاحب سالن دمو (چند بیزنس) |
| Staff | 09120000002 | 123456 | `/staff` | کارمند |
| Customer | 09120000003 | 123456 | `/me` | مشتری |
| Visitor | 09120000004 | 123456 | `/visitor` | بازاریاب |

**نکته چندنقشی:** شماره 09120000001 می‌تواند همزمان owner دمو، staff کلینیک دیگر، مشتری آرایشگاه سوم و visitor باشد — بعد از لاگین به `/choose-workspace` می‌رود و می‌تواند سوییچ کند (بدون لاگین مجدد). وقتی مالک یک کارمند را حذف کند، `token_version` آن کاربر +۱ می‌شود و سشنش بی‌صدا رفرش/ابطال می‌شود.

---

## 🔗 لندینگ‌ها

- محلی: `http://demo.business.localhost:3001` یا `http://demo.localhost:3001`
- پروداکشن: `https://{slug}.business.nobatet.com` و `https://{slug}.visitor.nobatet.com`
- انتخاب فضا: `/choose-workspace` (وقتی بیش از یک دسترسی داری)
- احراز هویت یکپارچه: `/auth` (هم لاگین هم ثبت‌نام) — بعد از لاگین به هوم برمی‌گردد، نه مستقیم داشبورد

---

## 🗄️ معماری نقش‌ها (RBAC)

> مستند کامل: `docs/ROLES_ARCHITECTURE.md` و `docs/ROLES_REDESIGN_IMPLEMENTATION.md`

- **یک منبع حقیقت:** `business_members` برای نقش‌های بیزنسی (owner/manager/staff) + `user_roles` برای سراسری (super_admin, visitor)
- **JWT:** `{ globalRoles[], memberships[], tokenVersion, role (legacy) }` — 30 روزه، httpOnly
- **Invalidation:** `users.token_version` + چک ارزان در `getSession()`
- **Proxy (Edge):** چک optimistic روی JWT با تابع `check`، بدون DB hit
- **API:** `requireBusinessSession` با fallback DB برای سشن‌های قدیمی + `requireSuperAdmin` با `globalRoles.includes`

---

## 📸 آپلود

- اندپوینت: `POST /api/upload` با `FormData { file, type }` + `credentials: include`
- انواع: `avatar, logo, banner, gallery, staff, video, general`
- بهینه‌سازی: sharp (اگر نصب باشد) → WebP 82%، در غیر این صورت فایل اصلی
- ذخیره: `public/uploads/{type}/{safeBase}-{timestamp}-{rand}.webp`
- لیست: `GET /api/upload` → `{ uploads: { avatar: [...], gallery: [...] } }`

UI: `src/components/ui/ImageUploader.js` (تکی) و `GalleryUploader` (چندتایی) — drag & drop، پیش‌نمایش، fallback URL

---

## 📅 تعطیلات رسمی

- فایل: `src/lib/iranianHolidays.js` — ۱۴۰۳، ۱۴۰۴ (۲۶ روز)، ۱۴۰۵ (۲۵ روز) با `jalali` و `gregorian`
- UI: `ScheduleManager` — بخش نارنجی «تعطیلات رسمی تقویم ایران» با فیلتر پیش‌رو/۱۴۰۵/۱۴۰۴ و دکمه «افزودن همه» — ثبت به عنوان `time_off` تمام‌روز (00:00 تا 23:59)

---

## 📊 داشبوردها

- **بیزنس:** `/business` → `BusinessDashboardCharts` (درآمد ۷ روز خطی، دونات وضعیت، میله خدمات، دونات هزینه، میله SMS، سود/زیان + QR)
- **گزارش‌ها:** `/business/reports` → خطی، دونات، میله‌ای، درآمد به تفکیک خدمت
- **ادمین:** `/admin` → کارت‌های تعداد، خطی رشد، دونات اشتراک، میله درآمد، SMS مصرفی هر بیزنس
- **ویزیتور:** `/visitor` → خطی رشد جذب، دونات وضعیت کمیسیون
- **کارمند:** `/staff` → دونات وضعیت، خطی ۷ نوبت، نرخ حضور
- **مشتری:** `/me` و `/me/history` → دونات وضعیت، میله هزینه ماهانه، نرخ وفاداری

همه داشبوردها:
- دکمه `🏠 خانه` → `/`
- دکمه `🌐 لندینگ` (اگر بیزنس دارد) → `https://{slug}.business.{domain}`
- دکمه `📊 داشبورد` → داشبورد همان نقش
- `⇄ سوییچ فضا` (اگر بیش از یک فضا) + `⇄ انتخاب فضا` در nav

---

## 💳 پرداخت کارت‌به‌کارت (پولیش)

- فیلدها: ۴ رقم آخر * + شماره پیگیری + توضیحات تراکنش * با placeholder «شماره تراکنش 458392 - تاریخ 1403/05/20 ساعت 14:30 - بانک ملت...»
- ذخیره در `payments.transferCode`, `transferNote`
- نمایش در `/business/payments` با کارت زرد و توضیحات آبی

---

## 🔐 امنیت

- JWT httpOnly, Secure prod, SameSite Lax, 30 روزه
- `token_version` برای ابطال بی‌صدا بدون logout اجباری
- RBAC سه‌لایه: Proxy (edge) → `requireBusinessSession` (DB fallback) → Service Layer (فیلتر `businessId`)
- Rate limit OTP (۶۰ ثانیه)، Attempts (۵ بار)
- ولیدیشن Zod در تمام APIها
- `.env` در `.gitignore`

---

## 📦 بیلد و دیپلوی

```bash
npm run build # → 79 صفحه (Static + Dynamic)
# → _not-found، admin، business/*، choose-workspace، auth، pay/*، pricing، sites/[type]/[slug] و...

# Liara
liara deploy
# liara_pre_build.sh خودکار: npm run migrate
```

چک‌لیست بعد از دیپلوی: `DEPLOY.md`

---

## 📝 مستندات اضافی

- `docs/ROLES_ARCHITECTURE.md` — معماری اولیه و محدودیت‌ها
- `docs/ROLES_REDESIGN_IMPLEMENTATION.md` — پیاده‌سازی بازطراحی multi-role
- `CHANGELOG_14TASKS.md` — گزارش ۱۴ تسک اصلی
- `DOCKER.md` — جزئیات Docker
- `PROJECT_CONTEXT.md` — پرامپت اصلی پروژه
- `AGENTS.md` — نکات برای coding agent

---

## 🤝 مشارکت

- استک: Next.js 16 (App Router, Proxy), React 19, Tailwind 4, Drizzle ORM, PostgreSQL, Framer Motion, Jose (JWT), bcryptjs, date-fns-jalali
- زبان: JavaScript only (بدون TypeScript)
- فونت: Vazirmatn (RTL)
- PWA: قابل نصب روی موبایل

> ساخته شده با ❤️ برای کسب‌وکارهای ایرانی — نوبتت: صف تلفن را جمع کنید؛ نوبت را آنلاین بفروشید
