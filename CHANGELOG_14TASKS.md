# گزارش پیاده‌سازی ۱۴ تسک - نوبتت

تاریخ: 2026-07-17

## ✅ خلاصه

همه ۱۴ تسک پیاده‌سازی و بیلد موفق (76 صفحه).

### 1. فیلدهای رزرو از قبل پر شود
**فایل:** `src/components/booking/BookingWizard.js`
- قبلا `readOnly` بود و اگر session دیر می‌رسید خالی می‌ماند
- فیکس: `fetch('/api/auth/me', {cache: 'no-store'})` + `setCustomerName(prev=>prev||fullName)` + قابل ویرایش نگه داشتن
- UI: بنر سبز "اطلاعات شما خودکار پر شد — قابل ویرایش"

### 2. لندینگ ویزیتور از صفر
**فایل:** `src/app/sites/[type]/[slug]/page.js` بخش visitor
- طراحی پریمیوم: هدر blury، هیرو ۲ ستونه، کد معرف بزرگ، آمار کمیسیون، ۳ دلیل ثبت‌نام، CTA تاریک
- QR و ساب‌دامین اختصاصی

### 3. درگاه Sandbox 404
- ریشه: وقتی رزرو از `demo.business.localhost:3001` بود، origin همان ساب‌دامین بود و proxy آن را به `/sites/business/demo/pay/sandbox` ری‌رایت می‌کرد → 404
- فیکس‌ها:
  - `src/proxy.js`: اضافه کردن `/pay`, `/auth`, `/login`, `/register`, `/pricing`, `/demo`, `/admin`, `/business`, `/staff`, `/visitor`, `/me` به `isInternal`
  - `src/app/api/public/bookings/route.js`: همیشه از `NEXT_PUBLIC_APP_URL` استفاده کند، نه `origin`
  - `src/services/payment.js`: تشخیص tenant subdomain و fallback به main domain + اضافه `bookingId` به URL

### 4. صفحه 404
**فایل:** `src/app/not-found.js`
- گرادیان teal، عدد ۴۰۴ بزرگ، دکمه خانه و قیمت‌ها، ۳ کارت لینک سریع

### 5. داشبورد کسب‌وکار: عکس‌ها + نقشه
**Schema:** `src/db/schema/businesses.js`
- اضافه: `galleryUrls jsonb`, `latitude varchar`, `longitude varchar`
- **UI:** `src/components/business/SettingsForm.js` کامل بازنویسی:
  - لوگو URL + پیش‌نمایش
  - بنر اصلی + پیش‌نمایش
  - آواتار صاحب (ذخیره در `/api/auth/me` PATCH)
  - گالری چندتایی با افزودن/حذف
  - نقشه: latitude/longitude + iframe + لینک Google Maps
  - QR لندینگ با دانلود HD

**API:** `src/app/api/auth/me/route.js` اضافه PATCH برای avatar/firstName/lastName
**Service:** `src/services/business-service.js` updateBusinessSettings پشتیبانی gallery/ lat/lng

### 6. عکس کارمندان
**Schema:** `businessMembers.avatarUrl`
**Component:** `src/components/business/StaffManager.js`
- فرم افزودن شامل avatarUrl
- لیست با آواتار دایره‌ای + دکمه "تغییر تصویر" inline edit
- fallback به DiceBear initials اگر عکس نباشد

### 7. سوپرادمین: توضیحات پلن + SMS مصرفی
**Schema:** `src/db/schema/saas.js`
- plans: اضافه `longDescription text`, `price3Months int`, `maxSmsPerMonth int`, `tier varchar`
- جدید: `smsLogs` table (businessId, phone, pattern, bodyId, status, providerRef)
- جدید: `expenses` table (برای تسک 13)

**Service:** `src/services/sms.js`
- `sendSms(to, pattern, vars, {businessId})` لاگ خودکار در smsLogs
- همه جا businessId پاس داده می‌شود (payment notify, cron)

**API:** `src/app/api/business/sms-usage/route.js` جدید
- total, thisMonth, last30, byPattern, recent 20

**Admin UI:** `src/components/admin/AdminPlans.js`
- ویرایش پیشرفته: نام، توضیح کوتاه، توضیح بلند (longDescription)، قیمت ماهانه/۳ماهه/سالانه، maxStaff, maxSms, maxServices
- نمایش تخفیف ۳ماهه/سالانه

**Admin Overview:** `src/components/admin/AdminOverview.js`
- کارت‌ها + نمودار رشد تجمعی + دونات اشتراک‌ها + بار درآمد + نمایش smsCount هر بیزنس

### 8. پلن‌ها ۱/۳/۱۲ ماهه - پایه/حرفه‌ای/سازمانی
- seedDefaultPlans بازنویسی:
  - base: ۲ کارمند، ۲۰۰ پیامک، 290/790/2.9M
  - pro: ۵ کارمند، ۱۰۰۰ پیامک، 590/1590/5.9M (محبوب)
  - enterprise: ۲۰ کارمند، ۵۰۰۰ پیامک، 1.29/3.49/12.9M
- `src/app/pricing/page.js`: نمایش ۳ دوره با تخفیف، لیست قابلیت‌ها شامل SMS و QR و حسابداری
- `provisionBusinessSubscription` حالا base را fallback می‌گیرد نه starter

### 9. دکمه دریافت نوبت اول لندینگ
**فایل:** `src/app/sites/[type]/[slug]/page.js`
- top bar با دکمه "دریافت نوبت فوری"
- sticky header دسکتاپ با لوگو + دکمه
- دکمه موبایل در کاور + FAB پایین (fixed)
- scroll-mt برای anchor #book

### 10. QR Code در داشبورد
- SettingsForm: بخش QR + دانلود HD
- BusinessDashboardCharts: کارت گرادیان QR
- صفحه اختصاصی `src/app/business/qr/page.js` + `src/components/business/QrGenerator.js`
  - 400x400 و 1000x1000، چاپ، کپی لینک، راهنمای چاپ
- VisitorDashboard هم QR دارد

### 11. نمودارهای حرفه‌ای ۴ داشبورد
**Library:** `src/components/ui/Charts.js`
- BarChart, DonutChart, LineChart, StatCard, MiniArea - بدون نیاز به کتابخانه خارجی، SVG و CSS
- **Business:**
  - `BusinessDashboardCharts.js`: درآمد ۷ روز خطی، دونات وضعیت رزرو، میله پرکارترین خدمات، دونات هزینه، میله SMS، کارت سود/زیان
  - `ReportsDashboard.js`: خطی درآمد، دونات وضعیت، میله‌ای خدمات/کارمندان، درآمد به تفکیک
- **Admin:** AdminOverview خطی رشد + دونات اشتراک + میله درآمد
- **Visitor:** VisitorDashboard خطی رشد جذب + دونات وضعیت کمیسیون + میله ماهانه + دونات فعال/غیرفعال
- **Staff:** StaffBookings ۳ کارت آماری + دونات وضعیت + خطی ۷ نوبت اخیر
- **Customer:** MyBookings ۳ کارت + دونات وضعیت + میله هزینه ماهانه

### 12. کارت‌به‌کارت: ۴ رقم + توضیحات تراکنش
**Schema:** `payments.transferCode varchar(80)`, `transferNote text`
**BookingWizard:** Step 8:
- grid ۲ ستونه: ۴ رقم آخر * + شماره پیگیری
- textarea "توضیحات تراکنش *" placeholder: "شماره تراکنش 458392 - تاریخ 1403/05/20 ساعت 14:30 - بانک ملت..."
- helper: تاریخ/زمان/بانک/نام واریز کننده
**API:** `src/app/api/public/payments/card-to-card/route.js` schema شامل transferCode/Note
**Service:** `src/services/payment.js` createPaymentForBooking extra شامل code/note
**PaymentsManager:** نمایش کارت زرد با ۴ فیلد + توضیحات آبی + رسید

### 13. بخش هزینه کرد (حسابداری کوچک)
**Schema:** expenses table
**API:** `src/app/api/business/expenses/route.js` GET (days filter), POST, DELETE
**Component:** `src/components/business/ExpensesManager.js`
- کارت‌های کل هزینه، میانگین روزانه، بیشترین دسته
- تفکیک دسته‌ای با bar
- فرم ثبت: عنوان، مبلغ، دسته (rent/salary/purchase/marketing/bills/other)، تاریخ، توضیح
- لیست با حذف
**Page:** `src/app/business/expenses/page.js`
**Dashboard:** لینک در پنل کسب‌وکار

### 14. رجیستر و لاگین یکی
**Component جدید:** `src/components/auth/UnifiedAuth.js`
- Step phone: شماره موبایل → درخواست OTP
- API برمی‌گرداند isNewUser
- اگر جدید: OTP → profile (نام، نام خانوادگی، رمز، نقش + referralCode)
- اگر موجود: OTP + نمایش "ورود با رمز" و "فراموشی رمز / ارسال کد بازیابی"
- Step password: ورود با رمز
- Step otp-reset + new-password: بازیابی
- query params: ?ref=CODE & ?plan=... حفظ می‌شود
- UI: گرادیان زیبا، کارت سفید shadow-xl

**Pages:**
- `src/app/auth/page.js` جدید → UnifiedAuth
- `src/app/(auth)/login/page.js` و `register/page.js` حالا هر دو UnifiedAuth را رندر می‌کنند (یکی شدن واقعی)
- `src/proxy.js`: /auth به isInternal اضافه

---

## فایل‌های جدید
- src/app/not-found.js
- src/app/auth/page.js
- src/app/business/expenses/page.js
- src/app/business/qr/page.js
- src/app/api/business/expenses/route.js
- src/app/api/business/sms-usage/route.js
- src/components/ui/Charts.js
- src/components/business/BusinessDashboardCharts.js
- src/components/business/ExpensesManager.js
- src/components/business/QrGenerator.js
- src/components/auth/UnifiedAuth.js

## فایل‌های ویرایش شده کلیدی
- src/components/booking/BookingWizard.js
- src/app/sites/[type]/[slug]/page.js
- src/proxy.js
- src/services/payment.js
- src/services/sms.js
- src/services/business-service.js
- src/services/saas-service.js
- src/db/schema/businesses.js, bookings.js, saas.js
- src/components/business/SettingsForm.js
- src/components/business/StaffManager.js
- src/components/business/PaymentsManager.js
- src/components/business/ReportsDashboard.js
- src/components/admin/AdminOverview.js, AdminPlans.js
- src/components/visitor/VisitorDashboard.js
- src/components/staff/StaffBookings.js
- src/components/customer/MyBookings.js
- src/app/business/page.js
- src/app/pricing/page.js

## بیلد
```
npm run build → ✓ 76 pages (قبلا 72)
```

## نکات دیپلوی
- drizzle migration: `npm run db:generate` سپس `npm run db:push` یا `drizzle-kit migrate`
- smsLogs از این به بعد پر می‌شود، داده قدیمی صفر نمایش می‌دهد (طبیعی)
- برای avatar URLها فعلا URL خارجی پذیرفته می‌شود (آپلود فایل فاز بعدی)
- QR از api.qrserver.com (رایگان) — برای پروداکشن می‌توان به کتابخانه داخلی تغییر داد

## TODO پیشنهادی
- آپلود تصویر به S3/Liara Storage به جای URL
- SMS محدودیت: اگر thisMonth >= plan.maxSmsPerMonth هشدار بده
- چارت‌ها با Recharts برای انیمیشن بیشتر
- تست E2E برای فلوی UnifiedAuth
