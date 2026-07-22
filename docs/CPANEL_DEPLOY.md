# دیپلوی روی هاست اشتراکی cPanel - Node.js 24

> این راهنما برای هاست ایران (تحریم - بدون S3) نوشته شده - همه دیتا روی هاست است.

## پیش‌نیازها در cPanel

1. **Node.js**: نسخه 20 یا 24 را از قسمت `Setup Node.js App` انتخاب کن
2. **PostgreSQL**: از `PostgreSQL Databases` یک DB بساز (یا از هاست بخواه فعال کند). اگر فقط MySQL داری، باید Drizzle را به mysql تغییر دهی - ولی کد فعلی Postgres است.
3. **دامنه**: `nobatet.com` یا `yourdomain.com` را ست کن
4. **Wildcard**: برای ساب‌دامین تک سطحی `*.nobatet.com` باید یک wildcard subdomain بسازی:
   - cPanel > Subdomains > `*.nobatet.com` -> Document Root را روی `nodeapp/public` یا `public_html` بگذار؟
   - در حالت Node.js App، خود Passenger همه subdomain های `*.domain.com` را به اپ هدایت می‌کند اگر `Application URL` روی `/` باشد. پس فقط یک wildcard DNS رکورد `*.nobatet.com A -> IP هاست` بساز.

## نصب

```bash
# در File Manager یا SSH
cd ~/nobatet
npm install --production=false
# .env را بساز (از .env.example کپی)
cp .env.example .env
nano .env
# مقادیر واقعی را پر کن - مهم:
# DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
# NEXT_PUBLIC_BASE_DOMAIN=nobatet.com
# NEXT_PUBLIC_APP_URL=https://nobatet.com
# JWT_SECRET=یک رشته 32 کاراکتری قوی

# مایگریشن
npm run db:push
npm run db:seed

# بیلد
npm run build

# تست لوکال:
npm start
# باید روی پورت که cPanel داده (مثلاً 3001) بالا بیاید
```

## Startup File برای cPanel

در `Setup Node.js App`:
- **Application mode**: Production
- **Application root**: `/home/username/nobatet` (یا هر جا که کد را ریختی)
- **Application URL**: `/` (برای پوشش همه subdomain ها)
- **Application startup file**: 
  - اگر `output: standalone` خاموش است: `node_modules/next/dist/bin/next` با args `start -p $PORT`
  - راحت‌تر: یک فایل `server.js` بساز:

```js
// server.js - برای cPanel
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

سپس Startup file را `server.js` بگذار.

## آپلودها

تمام فایل‌ها در `public/uploads/{type}/{file}` ذخیره می‌شوند.
- مطمئن شو پوشه `public/uploads` writable است: `chmod 755 public/uploads -R`
- در cPanel، این پوشه باید داخل Application root باشد، نه public_html

اگر هاست `public_html` جدا دارد، یک symlink بساز:
```bash
ln -s ~/nobatet/public/uploads ~/public_html/uploads
ln -s ~/nobatet/public/icon-*.png ~/public_html/
```

## PWA

- `public/sw.js` نسخه 5 است - cache bust خودکار
- برای فعال‌سازی در پروداکشن: `NEXT_PUBLIC_ENABLE_SW=true` یا `NODE_ENV=production`
- در dev به صورت خودکار unregister می‌شود تا کش اذیت نکند

## دیتابیس

- Postgres روی cPanel ایران معمولاً روی `localhost:5432` است
- اگر هاست فقط MySQL دارد، باید `drizzle.config.js` و `src/db` را به mysql2 تغییر دهی (اسکوپ این تسک نیست)

## Cron برای یادآوری پیامک

در cPanel > Cron Jobs:
```
*/5 * * * * curl -H "Authorization: Bearer dev-cron-secret" https://nobatet.com/api/cron/maintenance
```

## تست نهایی

1. `https://nobatet.com` → هوم
2. `https://demo.nobatet.com` → لندینگ دمو (تک سطحی جدید)
3. لاگین در `https://nobatet.com/login` → باید در `https://demo.nobatet.com` هم لاگین باشی (چون Domain=.nobatet.com)
4. آپلود لوگو در `/business/settings` → باید در `/uploads/logo/...webp` ذخیره شود و نمایش داده شود

## نکات تحریم

- همه دیتا روی هاست است - S3 حذف شد
- ملی‌پیامک ایران - بدون وابستگی به Twilio
- sharp برای بهینه‌سازی WebP - روی Node 24 باید `npm rebuild sharp` بزنی اگر ارور داد
