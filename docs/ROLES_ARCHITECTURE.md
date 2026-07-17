# معماری نقش‌ها (RBAC) در نوبتت — مستند تخصصی

> نسخه: 1.0 — تاریخ: 2026-07-17
> استک: PostgreSQL + Drizzle ORM + Next.js 16 + JWT (jose)

---

## 1. فلسفه: چرا Single Table؟

در بازار ایران، هویت = شماره موبایل (`phone UNIQUE`). یک فرد می‌تواند:
- صاحب یک سالن (owner)
- کارمند یک کلینیک دیگر (staff)
- مشتری یک آرایشگاه سوم (customer)
- بازاریاب نوبتت (visitor)

اگر برای هر نقش جدول جدا می‌ساختیم، یک فرد با 3 نقش باید 3 اکانت جدا با 3 سیم‌کارت می‌داشت → تجربه کاربری فاجعه.

راه‌حل نوبتت: **Single Table Inheritance + Membership Table**.

### جدول اصلی: `users`

```ts
// src/db/schema/users.js
pgEnum('user_role', ['super_admin','visitor','business_owner','staff','customer'])

users {
  id uuid PK
  phone varchar(11) UNIQUE NOT NULL // کلید هویتی
  role user_role DEFAULT 'customer' // نقش پیش‌فرض برای روتینگ
  firstName, lastName, passwordHash, avatarUrl
  isActive, isPhoneVerified
  createdAt, updatedAt
}
```

`role` اینجا فقط **نقش پیش‌فرض برای انتخاب داشبورد** است، نه منبع نهایی دسترسی.

### جدول میانی: `business_members` — قلب Multi-Tenant + Multi-Role

```ts
pgEnum('membership_role', ['owner','manager','staff'])

businessMembers {
  id uuid PK
  businessId uuid FK → businesses.id (cascade)
  userId uuid FK → users.id (cascade)
  role membership_role DEFAULT 'staff' // نقش در سطح یک بیزنس خاص
  jobTitle varchar(100)
  avatarUrl text
  isActive boolean
  UNIQUE(businessId, userId) // یک کاربر در یک بیزنس فقط یک نقش فعال
}
```

یک `userId` می‌تواند N ردیف در این جدول داشته باشد → عضو 10 بیزنس با نقش‌های متفاوت.

### جدول بازاریاب: `visitors`

```ts
visitors {
  id uuid PK
  userId uuid FK → users.id (cascade) UNIQUE
  slug varchar UNIQUE // ali.visitor.nobatet.com
  referralCode varchar UNIQUE // کد معرف
  bio text
  commissionPercent int DEFAULT 20
}
```

اگر `users.role = visitor` باشد، حتما یک ردیف اینجا دارد.

### جدول کسب‌وکار

```ts
businesses {
  id uuid PK
  ownerId uuid FK → users.id (restrict) // مالک اصلی
  slug varchar UNIQUE // demo.business.nobatet.com
  name, description, logoUrl, bannerUrl, galleryUrls jsonb
  phone, city, address, latitude, longitude
  cancellationPolicy, depositPercent, cardNumber, cardHolderName
}
```

---

## 2. دیاگرام ER

```
[users] 1 ──* [business_members] *──1 [businesses]
  | 1               | (role: owner/manager/staff)
  |                 └─ isActive = true → دسترسی به پنل بیزنس
  |
  ├─ 1──0..1 [visitors] (slug, referralCode)
  │
  ├─ 1──* [bookings].customerId (یا customerPhone برای guest)
  │
  └─ 1──* [otpCodes].phone (غیر FK، چون کاربر ممکن است هنوز ساخته نشده)
```

---

## 3. مثال واقعی: یک شماره، 4 نقش

`phone = 09120000001` (seed owner):

```sql
-- users
id=uuid1, phone='09120000001', role='business_owner', firstName='مریم'

-- business_members
(uuid1, businessId=demo, role='owner', jobTitle='مدیر')
(uuid1, businessId=clinicX, role='staff', jobTitle='منشی')

-- visitors: (none)

-- bookings: به عنوان customerId در بیزنس‌های دیگر
```

- وقتی با این شماره لاگین می‌کند، JWT می‌گوید `role=business_owner` → Proxy به `/business` می‌فرستد.
- اما `/staff/bookings?businessId=clinicX` هم باز می‌شود چون `assertBusinessAccess(clinicX, uuid1, ['staff','manager','owner'])` یک ردیف برمی‌گرداند.
- وقتی در `demo.business.localhost:3001` رزرو می‌کند، `customerPhone=09120000001` ثبت می‌شود، اما `customerId` هم پر می‌شود → در `/me` تاریخچه دارد.

---

## 4. جریان احراز هویت و RBAC

### L1: Proxy (Edge) — `src/proxy.js` (Next 16)

```js
const PROTECTED = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/business', roles: ['business_owner','super_admin'] },
  { prefix: '/staff', roles: ['staff','business_owner','super_admin'] },
  { prefix: '/visitor', roles: ['visitor','super_admin'] },
  { prefix: '/me', roles: ['customer','business_owner','staff','visitor','super_admin'] },
];

token = cookies.get('nobatet_session')
session = await jwtVerify(token) // optimistic, بدون DB
if (!PROTECTED.find(r => pathname.startsWith(r.prefix) && r.roles.includes(session.role))) redirect
```

فقط برای UX سریع، نه امنیت.

### L2: Server Auth — `src/lib/api-auth.js` + `src/services/business-service.js`

```js
// api-auth.js
session = await getSession(); // از cookies() + jwtVerify
businessId = resolveBusinessId(session.sub) // اولین business_members فعال
access = assertBusinessAccess(businessId, session.sub, ['owner','manager'])
if (!access && session.role !== 'super_admin') return 403

// business-service.js
export function getBusinessesForUser(userId) {
  return db.select()
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(eq(businessMembers.userId, userId) && isActive);
}
```

### L3: Service Layer — ایزولیشن تنانت

```js
db.select().from(bookings).where(eq(bookings.businessId, auth.businessId))
```

همیشه فیلتر بر اساس `businessId` از سشن → جلوگیری از نشت داده بین تنانت‌ها.

### JWT Payload

```ts
// lib/auth.js createSession
SignJWT({ phone, role, firstName, lastName })
  .setSubject(user.id)
  .setExpirationTime('7d')
  .sign(secret)

// Cookie: nobatet_session, httpOnly, Secure prod, SameSite Lax
```

---

## 5. محدودیت‌های فعلی و نقشه راه بهبود

### مشکل 1: JWT تک‌نقشی
الان توکن فقط یک `role` دارد. اگر کاربر هم `business_owner` هم `visitor` باشد، باید نقش را تغییر دهد یا دوباره لاگین کند.

**راه‌حل پیشنهادی:**
```ts
// payload جدید
{ sub, phone, roles: ['business_owner','visitor'], memberships: [{businessId, role: 'owner'}] }
// یا حذف role از JWT و همیشه از DB خواندن + کش Redis
```

### مشکل 2: دو منبع حقیقت
`users.role` + `businessMembers.role` → برای گزارش باید هر دو را چک کنی.

**راه‌حل:** جدول `user_roles` junction:

```ts
userRoles {
  userId FK → users.id
  role user_role
  businessId FK → businesses.id nullable // null = global role
  UNIQUE(userId, role, businessId)
}
// users.role به عنوان cache باقی بماند یا حذف شود
```

### مشکل 3: visitor جدا
visitor الان فقط global است. اگر بخواهد کارمند هم باشد باید role را عوض کند.

**راه‌حل:** visitor را هم به عنوان یک `businessId = null` role در `userRoles` مدل کن، یا اجازه بده `visitors` + `businessMembers` همزمان وجود داشته باشند (الان هم ممکن است، فقط `users.role` باید یکی باشد).

### مشکل 4: super_admin bypass سخت‌کد
```js
if (session.role !== 'super_admin') check access
```
بهتر است permission-based شود: `hasPermission(user, 'business:read:any')`

### مشکل 5: نیاز به Refresh Token
وقتی `businessMembers` تغییر می‌کند (مثلا کارمند اخراج می‌شود)، JWT قدیمی هنوز معتبر است تا 7 روز. باید:
- `isActive` چک در هر API (الان انجام می‌شود ✅)
- یا زمان انقضای کوتاه‌تر + refresh token

---

## 6. نتیجه‌گیری برای تصمیم‌گیری

| سناریو | آیا با یک شماره ممکن است؟ | چگونه؟ |
|--------|---------------------------|--------|
| مالک 2 بیزنس | بله | 2 ردیف در business_members با role=owner |
| مالک بیزنس A + کارمند بیزنس B | بله | owner + staff |
| مالک + مشتری بیزنس دیگر | بله | owner در A + booking با customerId یا customerPhone در B |
| ویزیتور + صاحب بیزنس | بله ولی با تغییر users.role | پیشنهاد userRoles |
| کارمند + ویزیتور | بله با همین محدودیت | پیشنهاد بهبود |

**معماری فعلی برای MVP و بازار ایران ایده‌آل است:** ساده، با یک شماره چند بیزنس، بدون نیاز به ایمیل، با OTP. برای فاز سازمانی (20+ کارمند، تیم فروش) پیشنهاد مهاجرت به `user_roles` + JWT چندنقشی + کش Redis برای `getBusinessesForUser`.

---

## فایل‌های کلیدی

- `src/db/schema/users.js` — enum + users + otp
- `src/db/schema/businesses.js` — businesses + businessMembers + visitors
- `src/lib/auth.js` — JWT + session
- `src/proxy.js` — Edge RBAC
- `src/lib/api-auth.js` — requireBusinessSession
- `src/services/business-service.js` — getBusinessesForUser, assertBusinessAccess
- `src/services/saas-service.js` — getPlatformOverview, visitor stats
