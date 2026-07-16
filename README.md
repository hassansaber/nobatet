# نوبتت (Nobatet)

پلتفرم SaaS چندمستأجری نوبت‌دهی + CRM برای کسب‌وکارهای ایرانی.

## اجرا با Docker

```bash
docker compose up -d --build
# → http://localhost:3001
```

## توسعه محلی

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

## حساب‌های seed

| نقش | موبایل | رمز |
|-----|--------|-----|
| Super Admin | 09120000000 | 123456 |
| Owner | 09120000001 | 123456 |
| Staff | 09120000002 | 123456 |
| Customer | 09120000003 | 123456 |
| Visitor | 09120000004 | 123456 |

لندینگ دمو (wildcard): `http://demo.business.localhost:3001`  
پروداکشن: `https://{slug}.business.nobatet.com`

## نکات

- SMS واقعی ملی‌پیامک (بدون mock)
- زمان‌بندی اسلات‌ها بر اساس **Asia/Tehran**
- پلن‌ها فقط در پنل سوپرادمین و صفحه `/pricing`
