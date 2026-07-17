# راهنمای دیپلوی نوبتت روی Liara

## پیش‌نیاز

1. اکانت [Liara](https://liara.ir)
2. دیتابیس PostgreSQL روی Liara
3. دامنه (اختیاری) + Wildcard DNS برای ساب‌دامین

## متغیرهای محیطی (Environment)

از `.env.example` کپی کنید و در پنل Liara تنظیم کنید:

| کلید | توضیح |
|------|--------|
| `DATABASE_URL` | Connection string PostgreSQL لیارا |
| `JWT_SECRET` | رشته تصادفی بلند |
| `MELIPAYAMAK_USERNAME` | نام کاربری ملی‌پیامک |
| `MELIPAYAMAK_API_KEY` | API Key (نه رمز پنل) |
| `MELIPAYAMAK_BODYID_OTP` | کد متن پترن OTP |
| `NEXT_PUBLIC_BASE_DOMAIN` | مثلاً `nobatet.com` |
| `NEXT_PUBLIC_APP_URL` | مثلاً `https://nobatet.com` |
| `CRON_SECRET` | برای endpoint cron |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_ENABLE_SW` | `true` برای PWA در صورت نیاز |

## مراحل

```bash
# لوکال — migration تولید
npm run db:generate

# دیپلوی با Liara CLI
liara deploy
```

فایل‌های مرتبط:

- `liara.json` — تنظیمات پلتفرم Next
- `liara_pre_build.sh` — اجرای `npm run migrate` قبل از استارت
- `package.json` → اسکریپت `migrate`

## Wildcard Subdomain

در DNS:

```
A     @              → IP/CNAME لیارا
CNAME *              → nobatet.com
```

در اپ لیارا، دامنه و `*.nobatet.com` را اضافه کنید.

Proxy پروژه (`src/proxy.js`) این الگوها را پشتیبانی می‌کند:

- `slug.business.nobatet.com`
- `slug.visitor.nobatet.com`
- `slug.nobatet.com` (shorthand بیزنس)

## Cron Job (Liara)

ایجاد Cron:

```
POST https://nobatet.com/api/cron/maintenance
Header: x-cron-secret: <CRON_SECRET>
Schedule: هر ۱۵ دقیقه
```

وظایف: انقضای قفل slot + یادآوری ۲۴س/۲س (اگر bodyId ست باشد).

## Seed اولیه (اختیاری)

یک‌بار روی سرور با دسترسی SSH/console:

```bash
npm run db:seed
```

حساب‌ها: `README.md` بخش seed.

## چک‌لیست بعد از دیپلوی

- [ ] `/api/health` → ok
- [ ] OTP واقعی به موبایل (IP سرور در پنل ملی‌پیامک مجاز باشد)
- [ ] Wildcard: `https://demo.business.nobatet.com`
- [ ] لاگین owner و مشاهده داشبورد
- [ ] Install PWA روی موبایل (HTTPS لازم است)
- [ ] Cron maintenance

## PWA

- `src/app/manifest.js`
- `public/sw.js` + `public/offline.html`
- ثبت SW در production از `ServiceWorkerRegister`
