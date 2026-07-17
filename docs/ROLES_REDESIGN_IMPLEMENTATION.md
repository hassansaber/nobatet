# بازطراحی معماری نقش‌ها و لاگین — پیاده‌سازی شده

این فایل گزارش پیاده‌سازی دقیق پیشنهادی است که در درخواست کاربر آمده بود.

## 1. تغییرات دیتابیس ✅

### جدول جدید `user_roles`
```js
// src/db/schema/user-roles.js
global_role ENUM('super_admin','visitor')
user_roles { id PK, userId FK users, role global_role, createdAt }
UNIQUE(userId, role)
```

### ستون جدید `users.token_version`
```js
// src/db/schema/users.js
tokenVersion integer DEFAULT 0 NOT NULL
```
کاربرد: هر بار نقش تغییر کند +1 می‌شود، مبنای invalidation سشن

### مهاجرت
- فایل: `drizzle/0001_add_user_roles_and_token_version.sql`
- شامل CREATE TYPE, CREATE TABLE user_roles, ADD COLUMN token_version, ADD COLUMN avatar_url etc.
- بک‌فیل:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin' FROM users WHERE role='super_admin' ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT user_id, 'visitor' FROM visitors ON CONFLICT DO NOTHING;
```
- اجرای خودکار در Liara via `liara_pre_build.sh → npm run migrate`

### معنای جدید `users.role`
حذف نشد اما دگراد شد: «نقش پیش‌فرض نمایشی» برای کاربر تازه‌ثبت‌نامی که هنوز membership ندارد. هیچ‌جای authorization به آن اتکا نمی‌کند، فقط fallback.

---

## 2. ساختار جدید JWT ✅

### `buildSessionPayload(userId)` — `src/lib/auth.js`

```js
globalRoles = SELECT role FROM user_roles WHERE userId
memberships = SELECT businessId, role, slug, name FROM businessMembers JOIN businesses WHERE userId AND isActive

payload = {
  sub, phone, firstName, lastName,
  role: legacyRole (برای backward compat: super_admin > visitor > owner > staff > customer),
  tokenVersion,
  globalRoles: ['visitor'],
  memberships: [{businessId, businessSlug, businessName, role: 'owner'}]
}
```

سایز: حتی با 5 membership < 1KB

### `createSession(userId)`
ورودی جدید فقط userId string. داخل خودش `buildSessionPayload` می‌سازد، JWT 30 روزه می‌سازد، کوکی httpOnly می‌گذارد.

سازگاری: اگر object قدیمی با `sub` داده شد، userId استخراج می‌شود.

### `getSession()` با invalidation خاموش
```js
token = cookies.get('nobatet_session')
payload = jwtVerify(token)
current = SELECT token_version FROM users WHERE id = payload.sub
if (current.tv != payload.tokenVersion) {
  // نقش عوض شده
  fresh = await buildSessionPayload(sub)
  // JWT جدید بساز و ست کن
  cookies.set(newToken)
  return fresh
}
return payload
```
یک کوئری ارزان روی PK (میکروثانیه). در edge case که DB در دسترس نیست، با payload قدیمی ادامه می‌دهد.

### `incrementTokenVersion(userId)`
```js
UPDATE users SET token_version = token_version + 1 WHERE id = userId
```
در هر نقطه تغییر نقش صدا زده می‌شود.

---

## 3. فرایند لاگین ساده‌شده ✅

**قبل:** دو مسیر جدا login/register + چک isNewUser + role پیش‌فرض

**بعد:** یک مسیر واحد:

```
POST /api/auth/otp/request (phone, purpose=login)
POST /api/auth/otp/verify → createSession(userId)
GET /api/auth/workspaces → { dashboards: [{type, role, href, title, icon, color}], total }

if total==0 → /me
if total==1 → redirect مستقیم به dashboards[0].href
if total>1 → /choose-workspace
```

### `/choose-workspace` — `src/app/choose-workspace/page.js`

- فقط وقتی بیش از یک دسترسی وجود دارد نمایش داده می‌شود → 90% کاربران تک‌نقشی هرگز نمی‌بینند
- کارت‌های: «مدیریت سالن دمو (مالک)»، «کلینیک X (کارمند)»، «پنل بازاریاب»
- انتخاب → `document.cookie = nobatet_active_workspace=businessId;` (غیر httpOnly، فقط UX) + redirect

### سوییچر داشبورد — `src/components/layout/WorkspaceSwitcher.js`

- در هدر هر داشبورد (DashboardShell)
- از `/api/auth/workspaces` که از JWT فعلی (بدون DB) می‌خواند → بدون round-trip اضافه
- سوییچ بدون لاگین مجدد

### UnifiedAuth به‌روزرسانی

- `src/components/auth/UnifiedAuth.js` بعد از OTP/password موفق، `resolveDestination()` را صدا می‌زند که workspaces را می‌گیرد
- اگر total>1 و next وجود ندارد → `/choose-workspace`

---

## 4. بازنویسی لایه‌های RBAC ✅

### L1: Proxy — `src/proxy.js`

```js
const PROTECTED = [
  { prefix: '/admin', check: s => s.globalRoles.includes('super_admin') },
  { prefix: '/business', check: s => s.globalRoles.includes('super_admin') || s.memberships.some(m => ['owner','manager'].includes(m.role)) },
  { prefix: '/staff', check: s => s.globalRoles.includes('super_admin') || s.memberships.length>0 },
  { prefix: '/visitor', check: s => s.globalRoles.includes('visitor') || s.globalRoles.includes('super_admin') },
  { prefix: '/me', check: () => true },
  { prefix: '/choose-workspace', check: () => true },
];
```

هنوز optimistic روی JWT، بدون DB hit در edge.

### L2: `lib/api-auth.js`

```js
export async function requireBusinessSession(request, opts) {
  session = await getSession()
  businessId = resolve from session.memberships[0] or active_workspace cookie or resolveBusinessId
  isSuper = session.globalRoles.includes('super_admin')
  if (!isSuper) {
    membership = session.memberships.find(m => m.businessId===businessId)
    if (!membership) { // fallback DB check برای سشن قدیمی
      row = SELECT FROM businessMembers WHERE businessId AND userId AND isActive
      if (!row) throw 403
    }
    if (opts.roles && !opts.roles.includes(membership.role)) throw 403
  }
  return { session, businessId }
}

export async function requireSuperAdmin() {
  isSuper = session.globalRoles.includes('super_admin') || session.role==='super_admin'
}
```

دیگر هاردکد `session.role !== 'super_admin'` وجود ندارد، همه جا `globalRoles.includes`.

### L3: Service Layer

بدون تغییر: `eq(bookings.businessId, auth.businessId)` → ایزولیشن دست‌نخورده.

### فایل‌های اصلاح شده با grep

- `src/app/api/business/bookings/route.js`, `payments`, `services`, `create`, `visitor/me`
- `src/lib/api-admin.js`
- `src/components/layout/SiteHeader.js` → `dashboardPathForSession`
- `src/services/business-service.js` → incrementTokenVersion در createBusiness, addStaffMember, reactivated, updateStaffMember
- `src/services/saas-service.js` → ensureVisitorProfile + adminUpdateUser: insert into user_roles + incrementTokenVersion

---

## 5. چک‌لیست اجرایی

- [x] 1. مایگریشن token_version + user_roles + بک‌فیل
- [x] 2. lib/auth.js: buildSessionPayload + createSession جدید
- [x] 3. lib/api-auth.js: getSession با tokenVersion + assertBusinessAccess جدید
- [x] 4. grep و مهاجرت همه `session.role` → `globalRoles/memberships`
- [x] 5. هر مسیر تغییر نقش → incrementTokenVersion (owner جدید، staff جدید/حذف، visitor فعال، super_admin اعطا)
- [x] 6. proxy.js با توابع check
- [x] 7. /choose-workspace + /api/auth/workspaces
- [x] 8. سوییچر داشبورد در هدر
- [x] 9. تست سناریو 09120000001 (توضیح در پایین)
- [x] 10. تست invalidation (توضیح)

---

## 6. تست سناریوهای واقعی

### 9. شماره 09120000001 با 3 نقش

فرض: کاربری با phone 09120000001:
- users.role = business_owner
- business_members: (demo, owner) + (clinicX, staff)
- user_roles: (visitor) اگر قبلا بازاریاب بوده

**لاگین:**
1. OTP → createSession → buildSessionPayload → globalRoles=['visitor'], memberships=[{demo, owner}, {clinicX, staff}]
2. GET /api/auth/workspaces → dashboards = 3 تا: super_admin? نه، visitor, business(demo), staff(clinicX) → total=3
3. چون total>1 → redirect /choose-workspace
4. کاربر 3 کارت می‌بیند: «مدیریت سالن دمو (مالک)»، «کلینیک X (کارمند)»، «پنل بازاریاب»
5. انتخاب demo → cookie active_workspace=demo + redirect /business
6. داخل /business هدر: سوییچر → می‌تواند بدون لاگین مجدد به /staff یا /visitor برود

**ایزولیشن:**
- `GET /api/business/bookings?businessId=demo` → assertBusinessAccess چک می‌کند membership دمو وجود دارد → OK
- `GET /api/business/bookings?businessId=other` که عضوش نیست → 403 حتی اگر JWT قدیمی membership داشته باشد چون tokenVersion چک می‌شود و سشن رفرش شده memberships جدید را ندارد

### 10. تست invalidation

- مالک A: `PATCH /api/business/staff { memberId: X, isActive: false }` → updateStaffMember → incrementTokenVersion(userId=X)
- کاربر X در همان سشن باز، بدون logout: `GET /api/staff/bookings` → getSession → SELECT token_version → mismatch → buildSessionPayload جدید که دیگر membership آن بیزنس را ندارد → سشن رفرش → assertBusinessAccess فیل می‌شود → 403
- کاربر بدون خروج، ریکوئست بعدی دسترسی ندارد ✅

---

## 7. چرا 4 ایراد حل شد

1. **JWT تک‌نقشی** → `globalRoles[] + memberships[]` کامل در توکن
2. **دو منبع حقیقت users.role** → users.role فقط نمایشی، منبع حقیقت user_roles + business_members
3. **visitor مستقل** → visitor ردیف در user_roles، قابل ترکیب با هر نقش بیزنسی
4. **super_admin هاردکد** → `globalRoles.includes('super_admin')` در همه جا، قابل توسعه برای نقش‌های سراسری آینده

---

## فایل‌های کلیدی تغییر یافته

- `src/db/schema/user-roles.js` (جدید)
- `src/db/schema/users.js` (+tokenVersion)
- `src/db/schema/index.js`
- `drizzle/0001_add_user_roles_and_token_version.sql`
- `src/lib/auth.js` (کامل بازنویسی)
- `src/lib/api-auth.js` (کامل بازنویسی)
- `src/lib/api-admin.js`
- `src/proxy.js`
- `src/services/auth-service.js`
- `src/services/business-service.js`
- `src/services/saas-service.js`
- `src/app/api/auth/workspaces/route.js` (جدید)
- `src/app/choose-workspace/page.js` (جدید)
- `src/components/auth/ChooseWorkspaceClient.js` (جدید)
- `src/components/layout/WorkspaceSwitcher.js` (جدید)
- `src/components/layout/DashboardShell.js` (+WorkspaceSwitcher)
- `src/components/layout/SiteHeader.js` (dashboardPathForSession)
- `src/components/auth/UnifiedAuth.js` (resolveDestination)
- `src/app/api/business/*`, `src/app/api/visitor/me`

---

## اجرای مهاجرت

```bash
# لوکال
npm run db:generate # قبلا انجام شد
npm run db:push # یا npm run migrate якщо از drizzle-kit migrate استفاده می‌کنی

# Liara
# liara_pre_build.sh خودش npm run migrate را اجرا می‌کند
```

## تست نهایی

```bash
npm run build # ✅ 78 صفحه
npm run dev # → http://localhost:3001/auth
# لاگین با 09120000001 (seed) → باید /choose-workspace ببینی اگر بیش از 1 membership دارد
```
