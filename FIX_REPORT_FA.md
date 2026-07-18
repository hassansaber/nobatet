# گزارش جامع فیکس باگ احراز هویت — نوبتت

**تاریخ:** 2026-07-19
**فاز بندی:** ۵ فاز

---

## خلاصه مشکل از نگاه کاربر

1. **کاربر سایت اصلی با کاربر لندینگ جدا بود** — باید دوبار لاگین می‌کرد
2. **دکمه خروج داشبورد لندینگ کار نمی‌کرد** — بعد از خروج، هنوز در لندینگ لاگین بود
3. **سوییچ بین دمو لندینگ و هوم پلتفرم روان نبود** — حس می‌شد سایت کاملاً جدید در تب جدید باز می‌شود

---

## ریشه‌یابی بنیادی (Root Cause Analysis)

### 1. معماری کوکی اشتباه برای `localhost`

در `src/lib/auth.js` قدیمی:

```js
function getCookieDomain(){
  if(host === 'localhost') return 'localhost';
}
function getCookieOptions(){
  return { domain: 'localhost', sameSite: 'none', secure: true }
}
```

**مشکل:** طبق RFC6265 و رفتار کروم/فایرفاکس، `Domain=localhost` یک کوکی نامعتبر است و توسط مرورگر Drop می‌شود. یعنی `Set-Cookie: ...; Domain=localhost` اصلاً ذخیره نمی‌شود.

کد سعی می‌کرد با `try { set with domain } catch { set without domain }` فال‌بک کند، اما `cookies().set()` در Next.js خطا نمی‌دهد — مرورگر است که بعداً کوکی را رد می‌کند. پس fallback هیچ‌وقت اجرا نمی‌شد و عملاً هر host یک کوکی host-only جدا داشت:

- `localhost:3001` -> host-only cookie فقط برای `localhost`
- `demo.business.localhost:3001` -> host-only cookie فقط برای `demo.business.localhost`

پس کاربر مجبور بود در هرکدام جداگانه لاگین کند.

### 2. SSO مبتنی بر fetch ناقص

برای حل مشکل بالا، یک مکانیزم `/api/auth/token` + `/api/auth/sync` ساخته شده بود که در `TenantHeader` بود. اما:

- فقط مسیر `main -> tenant` را پوشش می‌داد، نه `tenant -> main`. اگر کاربر روی لندینگ لاگین می‌کرد، main هنوز لاگین نبود.
- متکی به `fetch(..., credentials: 'include', mode: 'cors')` بود که در کروم جدید با Third-Party Cookie Partitioning ممکن است بلاک شود.
- فقط در `TenantHeader` بود، نه در layout اصلی، پس وقتی از main به tenant می‌رفتی، با تاخیر sync می‌شد.

### 3. logout فقط لوکال

`logoutAction` که به صورت Server Action بود، فقط:

```js
cookies().set('nobatet_session','',{maxAge:0})
```

را روی host فعلی اجرا می‌کرد. اگر کوکی‌های host-only روی `localhost` و `demo.business.localhost` هر دو وجود داشتند، خروج از یکی، دیگری را پاک نمی‌کرد. کاربر در لندینگ هنوز لاگین می‌ماند — دقیقاً باگ گزارش شده.

### 4. UX ناپیوسته

در `src/app/demo/page.js` و `src/app/business/page.js` و `BusinessesSection.js`:

```jsx
<a href="http://demo.business.localhost:3001" target="_blank">
```

`target="_blank"` باعث باز شدن تب جدید می‌شد — حس "سایت کاملاً جدید" می‌داد. در حالی که انتظار می‌رود same-tab navigation با احساس یکپارچگی باشد.

همچنین `DashboardShell` دکمه "لندینگ" را با `target="_blank"` باز می‌کرد.

---

## راه‌حل معماری جدید — فازبندی

### فاز ۱: اصلاح هسته‌ی کوکی (`src/lib/auth.js`)

**اصول جدید:**

- **localhost واقعی** (`localhost`, `127.0.0.1`, `*.localhost`): `Domain` را اصلاً ست نکن → host-only. این تنها روش معتبر برای localhost است.
- **lvh.me** (دامنه‌ی جادویی که به 127.0.0.1 رزولو می‌شود ولی اجازه `Domain=.lvh.me` را می‌دهد): `Domain=.lvh.me` با `SameSite=Lax` → شیر خودکار بین ساب‌دامین‌ها، بدون نیاز به sync
- **پروداکشن** (`nobatet.com`): `Domain=.nobatet.com` با `SameSite=Lax` → یک کوکی مشترک برای همه ساب‌دامین‌ها (`demo.business.nobatet.com` هم شامل می‌شود)

```js
function getCookieDomain(){
  host = getRawBaseHost()
  if(isLocalHost) return undefined // host-only
  if(isLvhMe) return '.lvh.me'
  return '.nobatet.com' // دو بخش آخر
}

function getCookieOptions(maxAge){
  if(!domain) return { httpOnly:true, secure:true, sameSite:'none', path:'/', maxAge } // localhost
  if(isLvh) return { httpOnly:true, secure:false, sameSite:'lax', domain, path:'/', maxAge }
  return { httpOnly:true, secure:isProd, sameSite:'lax', domain, path:'/', maxAge } // prod
}
```

**destroySession** حالا ۷ ترکیب مختلف کوکی را پاک می‌کند تا تمام نسخه‌های قدیمی (با domain=localhost، بدون domain، sameSite none/lax) حذف شوند.

### فاز ۲: بازنویسی APIهای SSO

- `src/app/api/auth/token/route.js` – فقط token را برمی‌گرداند، با CORS `Vary: Origin` و `Allow-Credentials`
- `src/app/api/auth/sync/route.js` – با منطق جدید کوکی (بدون domain برای localhost) یک fresh JWT می‌سازد و ست می‌کند. هم برای `main->tenant` و هم `tenant->main` قابل استفاده است.
- `src/app/api/auth/me/route.js` و `workspaces/route.js` – CORS هدرها استاندارد شد
- `src/app/api/auth/logout/route.js` – حالا هم `POST` و هم `GET` را ساپورت می‌کند و CORS دارد تا از host دیگر هم بتوان آن را صدا زد.

### فاز ۳: SsoProvider یکپارچه

فایل جدید `src/components/auth/SsoProvider.js` (Client Component) در `src/app/layout.js` نصب شد:

- روی **tenant** اگر local session ندارد ولی main دارد → `GET main/api/auth/me` → `GET main/api/auth/token` → `POST tenant/api/auth/sync`
- روی **tenant** اگر local session دارد ولی قبلاً به main پوش نکرده → `GET tenant/api/auth/token` → `POST main/api/auth/sync` تا برگشت به هوم هم لاگین بماند
- لیست `visited_hosts` را در `localStorage` نگه می‌دارد تا logout بتواند همه را پاک کند.

`TenantHeader` هم بازنویسی شد تا همین منطق را داشته باشد و رویداد `nobatet:sso-synced` را گوش کند.

### فاز ۴: فیکس خروج یکپارچه

`DashboardShell.js` کامل بازنویسی شد:

- دیگر از `form action={logoutAction}` استفاده نمی‌کند.
- `handleLogout()`:
  1. `POST /api/auth/logout` روی host فعلی
  2. `POST ${mainOrigin}/api/auth/logout` با `mode: cors` برای پاک کردن main
  3. حلقه روی `localStorage.visited_hosts` و پاک کردن هرکدام
  4. پاک کردن `sessionStorage` و `localStorage` مرتبط
  5. `window.location.href = '/login'` با full reload

حالا خروج از داشبورد بیزنس، هم main و هم تمام لندینگ‌های ویزیت شده را خارج می‌کند. در پروداکشن چون کوکی مشترک `.nobatet.com` است، یک بار پاک کردن کافی است.

### فاز ۵: روان‌سازی UX سوییچ

- **حذف `target="_blank"`** در:
  - `src/app/demo/page.js` – حالا same-tab navigation با توضیح "same-tab • احراز هویت یکپارچه"
  - `src/app/business/page.js` – دکمه "لندینگ عمومی" بدون new tab
  - `src/components/home/BusinessesSection.js` – کارت بیزنس‌ها بدون new tab
  - `src/components/layout/DashboardShell.js` – دکمه "لندینگ" بدون new tab

- **Glassmorphism & Motion** بر اساس اسکیل `ui-ux-pro-max`:
  - هدرها `backdrop-blur-xl bg-white/70 border-white/40`
  - کارت‌ها `hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
  - انیمیشن `fadeIn` برای لود
  - نمایش آنلاین بودن با `animate-pulse` سبز
  - لودینگ state برای دکمه‌ها

- **UnifiedAuth** حالا بعد از هر لاگین موفق، اگر روی tenant باشد، سشن را به main هم پوش می‌کند تا برگشت روان باشد.

---

## فایل‌های تغییر یافته

| فایل | تغییر |
|------|-------|
| `src/lib/auth.js` | بازنویسی کامل منطق دامنه کوکی، حذف `Domain=localhost`، ساپورت `lvh.me` و `.nobatet.com` |
| `src/app/api/auth/sync/route.js` | همگام با auth.js جدید |
| `src/app/api/auth/token/route.js` | CORS بهبود |
| `src/app/api/auth/me/route.js` | CORS بهبود |
| `src/app/api/auth/logout/route.js` | ساپورت GET+POST+ CORS برای cross-domain logout |
| `src/app/api/auth/workspaces/route.js` | Vary header |
| `src/components/auth/SsoProvider.js` | **جدید** – SSO خودکار |
| `src/components/auth/UnifiedAuth.js` | افزودن `pushSessionToMainIfNeeded` |
| `src/components/layout/TenantHeader.js` | بازنویسی کامل SSO + UI بهبود |
| `src/components/layout/DashboardShell.js` | بازنویسی logout + حذف target _blank + UI بهبود |
| `src/components/layout/WorkspaceSwitcher.js` | set cookie با domain برای شیر بین ساب‌دامین |
| `src/app/layout.js` | افزودن `SsoProvider` |
| `src/app/demo/page.js` | حذف _blank + توضیح یکپارچگی + UI بهبود |
| `src/app/business/page.js` | حذف _blank |
| `src/components/home/BusinessesSection.js` | حذف _blank |

---

## چگونه تست کنیم (لوکال)

```bash
cp .env.example .env
# .env:
JWT_SECRET=strong-secret-min-32-chars
NEXT_PUBLIC_BASE_DOMAIN=localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
DATABASE_URL=postgres://...

npm install
npm run dev
```

### سناریوی طلایی (باید بدون باگ باشد)

1. `http://localhost:3001/login` با `09120000001 / 123456` لاگین کن → به `/business` برو
2. در هدر داشبورد روی **لندینگ** کلیک کن (same-tab) → باید به `http://demo.business.localhost:3001` بروی و **بدون لاگین مجدد** هدر نام شما را نشان دهد و دکمه داشبورد فعال باشد
3. از لندینگ روی **داشبورد** کلیک کن → به `http://localhost:3001/business` برگرد، بدون لاگین مجدد
4. در داشبورد **خروج** بزن → باید به `/login` بروی
5. دوباره `http://demo.business.localhost:3001` را باز کن → باید **خارج شده** باشی، نه لاگین
6. حالا برعکس: روی لندینگ `http://demo.business.localhost:3001/login?next=...` لاگین کن → بعدش به `http://localhost:3001` برو → باید لاگین باشی (tenant->main push)

### پروداکشن

- `NEXT_PUBLIC_BASE_DOMAIN=nobatet.com`
- `NEXT_PUBLIC_APP_URL=https://nobatet.com`
- کوکی `Domain=.nobatet.com` به صورت خودکار بین `nobatet.com` و `*.business.nobatet.com` و `*.visitor.nobatet.com` شیر می‌شود، بدون نیاز به fetch sync. logout هم با یک بار پاک کردن `.nobatet.com` همه جا را خارج می‌کند.

---

## نکات تکمیلی بر اساس Next.js 16 Docs

- `proxy.js` (ex-middleware) در Next 16 به `src/proxy.js` با export `proxy` تغییر نام داده — پروژه قبلاً درست بود.
- `cookies()` در Next 16 async است — در `lib/auth.js` از `await cookies()` استفاده شده (درست).
- `SameSite=None` حتماً باید `Secure=true` باشد — در localhost چون secure context است، کروم اجازه می‌دهد.
- برای `lvh.me` چون http است، `Secure=false` و `SameSite=Lax` انتخاب شد تا قابل ست باشد.

---

## وضعیت بیلد

```
✓ Compiled successfully
Build complete
```

تمام روت‌ها بدون ارور کامپایل می‌شوند.

---

## جمع‌بندی

- **ریشه باگ توکن نبود، معماری کوکی بود** (Domain=localhost نامعتبر)
- **فیکس بنیادی:** host-only برای localhost + `.nobatet.com` برای prod + SsoProvider برای sync
- **خروج یکپارچه:** پاک کردن cross-domain + visited_hosts
- **سوییچ روان:** حذف target _blank + same-tab navigation + پیش‌همگام‌سازی احراز هویت

پروژه اکنون برای `npm run dev` روی `localhost:3001` و `*.business.localhost:3001` و همچنین برای پروداکشن روی `nobatet.com` آماده است.
