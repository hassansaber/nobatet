# اجرای نوبتت با Docker

## یک دستور

```bash
cd nobatet
docker compose up -d --build
```

بعد برو:

**http://localhost:3001**

Schema و seed خودکار در entrypoint اجرا می‌شوند.

## دستورات مفید

```bash
docker compose logs -f app     # لاگ اپ
docker compose ps              # وضعیت
docker compose down            # توقف
docker compose down -v         # توقف + پاک کردن دیتابیس
docker compose exec app node scripts/seed.js   # seed دوباره
npm run smoke                  # تست API (بعد از بالا آمدن)
```

یا:

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

## سرویس‌ها

| سرویس | ایمیج | پورت |
|--------|--------|------|
| `db` | `postgres:17` | `5432` |
| `app` | build از Dockerfile (`node:lts`) | `3001` → container `3000` |

هیچ نسخه پکیج/ایمیجی pin نشده؛ Docker/registry آخرین stable را می‌گیرد (`latest` / `lts`).

## Env

فایل `.env` از قبل پر شده و compose آن را لود می‌کند.

| کلید مهم | مقدار پیش‌فرض |
|----------|----------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/nobatet` |
| `JWT_SECRET` | dev secret |
| `MELIPAYAMAK_*` | اعتبار OTP شما |
| `RUN_SEED` | `true` |

SMS همیشه واقعی است (ملی‌پیامک). IP سرور را در پنل ملی‌پیامک مجاز کنید.

## حساب‌های seed

| نقش | موبایل | رمز |
|-----|--------|-----|
| Super Admin | 09120000000 | 123456 |
| Owner | 09120000001 | 123456 |
| Staff | 09120000002 | 123456 |
| Customer | 09120000003 | 123456 |
| Visitor | 09120000004 | 123456 |

- لندینگ دمو (wildcard): http://demo.business.localhost:3001  
- دمو کامل: http://localhost:3001/demo  
- production: `https://{slug}.business.nobatet.com`  

## فقط دیتابیس (برای npm run dev)

```bash
docker compose -f docker-compose.dev.yml up -d
# سپس در .env بگذارید:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nobatet
npm run db:push && npm run db:seed && npm run dev
```

## عیب‌یابی

```bash
docker compose logs app
docker compose exec db pg_isready -U postgres
curl http://localhost:3001/api/health
```

اگر پورت 3001/5432 اشغال است، در `docker-compose.yml` پورت‌ها را عوض کنید.
