# یکپارچه‌سازی ملی‌پیامک (Melipayamak)

## پترن (کد متن)

برای هر پیامک یک «کد متن» تأییدشده (`bodyId`) لازم است.

مثال OTP:

```text
کد تایید ورود شما {0} می باشد. نوبتت
```

`MELIPAYAMAK_BODYID_OTP=491032`

## اعتبارنامه

| پارامتر API | مقدار |
|-------------|--------|
| username | نام کاربری اکانت |
| password | **API Key** |

## SendByBaseNumber (پترن / خط خدماتی)

### SOAP

- non-WSDL: `http://api.payamak-panel.com/post/send.asmx`
- متد: `SendByBaseNumber`
- `text`: آرایه متغیرها به‌ترتیب `{0}`, `{1}`, ...
- `to`: **فقط یک** شماره — نمونه مستندات: `09123456789`
- `bodyId`: int

### REST (نمونه رسمی PHP ملی‌پیامک)

```
POST https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber
Content-Type: application/x-www-form-urlencoded
```

| فیلد | مثال |
|------|------|
| username | ... |
| password | API Key |
| text | `12345` یا `arg1;arg2` |
| to | `09123456789` |
| bodyId | `491032` |

> مهم: REST باید **form-urlencoded** باشد نه JSON.  
> `text` در REST رشته با جداکننده `;` است.

## recId موفق

عدد یکتا **بیش از ۱۵ رقم**.

## کدهای خطای رایج

| کد | معنی |
|----|------|
| 18 | شماره گیرنده نامعتبر |
| 16 | شماره گیرنده‌ای یافت نشد |
| -109 | IP مجاز تنظیم نشده |
| -110 | باید ApiKey بفرستید نه رمز پنل |
| 0 | یوزر/پس اشتباه |
| 2 | اعتبار ناکافی |

## پیاده‌سازی پروژه

`src/services/sms.js`

1. نرمال‌سازی `to` → `09xxxxxxxxx`
2. REST form-urlencoded
3. fallback SOAP XML
4. fallback SOAP form POST

```js
import { sendOtpSms } from '@/services/sms';
await sendOtpSms('09123456789', '12345');
```

## OTP API اپ

```http
POST /api/auth/otp/request
Content-Type: application/json

{ "phone": "09123456789", "purpose": "login" }
```

**GET روی این URL = 405** (عمدی). از فرم UI استفاده کنید.
