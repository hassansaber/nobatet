/**
 * سرویس پیامک — ملی‌پیامک (Melipayamak)
 *
 * طبق مستندات رسمی:
 * - SOAP SendByBaseNumber:
 *   http://api.payamak-panel.com/post/send.asmx
 *   text = آرایه متغیرهای پترن {0},{1},...
 *   to   = یک شماره (نمونه: 09123456789)
 *   bodyId = کد متن
 *
 * - REST BaseServiceNumber:
 *   https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber
 *   Content-Type: application/x-www-form-urlencoded
 *   text = "arg1;arg2;..."  (رشته با جداکننده ;)
 *   to, bodyId, username, password
 *
 * recId عددی بیش از ۱۵ رقم = موفق
 */

/** @typedef {'otp' | 'booking_confirm' | 'booking_notify_owner' | 'reminder_24h' | 'reminder_2h' | 'booking_cancel' | 'card_confirm' | 'card_reject' | 'subscription_reminder'} SmsPattern */

const PATTERN_ENV_KEYS = {
  otp: 'MELIPAYAMAK_BODYID_OTP',
  booking_confirm: 'MELIPAYAMAK_BODYID_BOOKING_CONFIRM',
  booking_notify_owner: 'MELIPAYAMAK_BODYID_BOOKING_NOTIFY_OWNER',
  reminder_24h: 'MELIPAYAMAK_BODYID_REMINDER_24H',
  reminder_2h: 'MELIPAYAMAK_BODYID_REMINDER_2H',
  booking_cancel: 'MELIPAYAMAK_BODYID_BOOKING_CANCEL',
  card_confirm: 'MELIPAYAMAK_BODYID_CARD_CONFIRM',
  card_reject: 'MELIPAYAMAK_BODYID_CARD_REJECT',
  subscription_reminder: 'MELIPAYAMAK_BODYID_SUBSCRIPTION_REMINDER',
};

const ERROR_CODES = {
  '-110': 'الزام استفاده از ApiKey به جای رمز عبور',
  '-109': 'الزام تنظیم IP مجاز برای استفاده از API',
  '-108': 'مسدود شدن IP به‌دلیل تلاش ناموفق استفاده از API',
  '-10': 'در میان متغیرهای ارسالی لینک وجود دارد',
  '-7': 'خطا در شماره فرستنده — با پشتیبانی تماس بگیرید',
  '-6': 'خطای داخلی — با پشتیبانی تماس بگیرید',
  '-5': 'متن ارسالی با متغیرهای متن پیش‌فرض همخوانی ندارد',
  '-4': 'کد متن صحیح نیست یا تأیید نشده',
  '-3': 'خط ارسالی در سیستم تعریف نشده',
  '-2': 'محدودیت تعداد شماره — هر بار فقط یک موبایل',
  '-1': 'دسترسی به این وب‌سرویس غیرفعال است',
  0: 'نام کاربری یا رمز عبور صحیح نیست',
  2: 'اعتبار کافی نیست',
  3: 'محدودیت در ارسال روزانه',
  4: 'محدودیت در حجم ارسال',
  5: 'شماره فرستنده معتبر نیست',
  6: 'سامانه در حال به‌روزرسانی است',
  7: 'متن حاوی کلمه فیلترشده است',
  9: 'ارسال از خطوط عمومی از طریق وب‌سرویس ممکن نیست',
  10: 'کاربر مورد نظر فعال نیست',
  11: 'ارسال نشده',
  12: 'مدارک کاربر کامل نیست',
  14: 'متن حاوی لینک است',
  15: 'ارسال به بیش از یک شماره بدون «لغو۱۱» ممکن نیست',
  16: 'شماره گیرنده‌ای یافت نشد',
  17: 'متن پیامک خالی است',
  18: 'شماره گیرنده نامعتبر است',
  19: 'از محدودیت ساعتی فراتر رفته‌اید',
  35: 'شماره در لیست سیاه مخابرات است (REST)',
};

/**
 * نرمال‌سازی گیرنده → 09xxxxxxxxx (نمونه مستندات ملی‌پیامک)
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeSmsRecipient(input) {
  if (input == null) return null;
  let phone = String(input).trim().replace(/[\s\-()]/g, '');

  phone = phone
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`;
  if (phone.startsWith('0098')) phone = `0${phone.slice(4)}`;
  if (phone.startsWith('98') && phone.length === 12) {
    phone = `0${phone.slice(2)}`;
  }
  if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`;

  phone = phone.replace(/\D/g, '');
  if (phone.length === 10 && phone.startsWith('9')) phone = `0${phone}`;

  if (!/^09\d{9}$/.test(phone)) return null;
  return phone;
}

class MelipayamakProvider {
  constructor() {
    this.restUrl =
      process.env.MELIPAYAMAK_REST_URL ||
      'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber';
    // SOAP endpoint طبق مستند شما
    this.soapUrl =
      process.env.MELIPAYAMAK_SOAP_URL ||
      'http://api.payamak-panel.com/post/send.asmx';
    // HTTP POST form برای SendByBaseNumber
    this.soapFormUrl =
      process.env.MELIPAYAMAK_SOAP_FORM_URL ||
      'http://api.payamak-panel.com/post/send.asmx/SendByBaseNumber';
    this.username = process.env.MELIPAYAMAK_USERNAME || '';
    this.password = process.env.MELIPAYAMAK_API_KEY || '';
  }

  getBodyId(pattern) {
    const envKey = PATTERN_ENV_KEYS[pattern];
    if (!envKey) return null;
    const value = process.env[envKey];
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * @param {string} toRaw
   * @param {SmsPattern} pattern
   * @param {string[]} vars
   */
  async sendByPattern(toRaw, pattern, vars = []) {
    const to = normalizeSmsRecipient(toRaw);
    if (!to) {
      return {
        success: false,
        error: 'شماره گیرنده نامعتبر است (مثال صحیح: 09123456789)',
        code: '18',
      };
    }

    const bodyId = this.getBodyId(pattern);
    if (!bodyId) {
      return {
        success: false,
        error: `bodyId برای پترن «${pattern}» در .env تنظیم نشده است`,
      };
    }
    if (!this.username || !this.password) {
      return {
        success: false,
        error: 'اعتبارنامه ملی‌پیامک (USERNAME/API_KEY) تنظیم نشده است',
      };
    }

    const textVars = (vars || []).map((v) => String(v));

    // 1) REST form-urlencoded (روش رسمی نمونه PHP ملی‌پیامک)
    const rest = await this.sendRestForm(to, bodyId, textVars);
    if (rest.success) return rest;

    console.error('[sms] Melipayamak REST error', {
      to,
      pattern,
      bodyId,
      ...rest,
    });

    // 2) SOAP XML envelope
    const soap = await this.sendSoapXml(to, bodyId, textVars);
    if (soap.success) return soap;

    console.error('[sms] Melipayamak SOAP XML error', {
      to,
      pattern,
      bodyId,
      ...soap,
    });

    // 3) SOAP HTTP POST form (طبق wsdl op=SendByBaseNumber)
    const form = await this.sendSoapForm(to, bodyId, textVars);
    if (!form.success) {
      console.error('[sms] Melipayamak SOAP form error', {
        to,
        pattern,
        bodyId,
        ...form,
      });
    }
    return form.success ? form : rest;
  }

  /**
   * REST: application/x-www-form-urlencoded
   * text = "arg1;arg2"
   */
  async sendRestForm(to, bodyId, vars) {
    try {
      const text = vars.join(';');
      const body = new URLSearchParams({
        username: this.username,
        password: this.password,
        text,
        to,
        bodyId: String(bodyId),
      });

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch(this.restUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const raw = await res.text();
      return parseApiResponse(raw);
    } catch (err) {
      return {
        success: false,
        networkError: true,
        error:
          err instanceof Error
            ? `REST: ${err.message}`
            : 'خطای شبکه REST پیامک',
      };
    }
  }

  /**
   * SOAP XML — SendByBaseNumber
   * text = آرایه <string>var</string>
   */
  async sendSoapXml(to, bodyId, vars) {
    const textNodes = vars
      .map((v) => `<string>${escapeXml(v)}</string>`)
      .join('');

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendByBaseNumber xmlns="http://tempuri.org/">
      <username>${escapeXml(this.username)}</username>
      <password>${escapeXml(this.password)}</password>
      <text>${textNodes}</text>
      <to>${escapeXml(to)}</to>
      <bodyId>${bodyId}</bodyId>
    </SendByBaseNumber>
  </soap:Body>
</soap:Envelope>`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch(this.soapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://tempuri.org/SendByBaseNumber',
        },
        body: soapBody,
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const xml = await res.text();
      const match = xml.match(
        /<SendByBaseNumberResult>([^<]*)<\/SendByBaseNumberResult>/,
      );
      const resultRaw = (match?.[1] ?? '').trim();
      if (!resultRaw) {
        return {
          success: false,
          networkError: !res.ok,
          error: res.ok
            ? `پاسخ SOAP نامعتبر: ${xml.slice(0, 200)}`
            : `SOAP HTTP ${res.status}`,
        };
      }
      return interpretResult(resultRaw);
    } catch (err) {
      return {
        success: false,
        networkError: true,
        error:
          err instanceof Error
            ? `SOAP: ${err.message}`
            : 'خطای شبکه SOAP پیامک',
      };
    }
  }

  /**
   * SOAP form POST:
   * username=&password=&text=&text=&to=&bodyId=
   * (هر متغیر پترن یک فیلد text جدا)
   */
  async sendSoapForm(to, bodyId, vars) {
    try {
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);
      if (vars.length === 0) {
        params.append('text', '');
      } else {
        for (const v of vars) params.append('text', v);
      }
      params.append('to', to);
      params.append('bodyId', String(bodyId));

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch(this.soapFormUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: params.toString(),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const raw = await res.text();
      // ممکن است XML یا plain باشد
      const match = raw.match(
        /<string[^>]*>([^<]*)<\/string>|<SendByBaseNumberResult>([^<]*)<\/SendByBaseNumberResult>/,
      );
      const value = (match?.[1] || match?.[2] || raw).trim();
      return interpretResult(value);
    } catch (err) {
      return {
        success: false,
        networkError: true,
        error:
          err instanceof Error
            ? `SOAP-FORM: ${err.message}`
            : 'خطای شبکه SOAP form',
      };
    }
  }
}

function parseApiResponse(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // plain number / string
    return interpretResult(String(raw).trim());
  }

  // شکل رایج REST ملی‌پیامک:
  // { "Value": "...", "RetStatus": 1, "StrRetStatus": "Ok" }
  const value =
    data?.Value ??
    data?.value ??
    data?.SendByBaseNumberResult ??
    data?.retStr ??
    data?.Data ??
    data?.data ??
    null;

  if (value != null && value !== '') {
    const result = interpretResult(String(value).trim());
    // اگر Value کد خطا بود ولی RetStatus هم هست
    if (!result.success && data?.StrRetStatus) {
      result.error = `${result.error} (${data.StrRetStatus})`;
    }
    return result;
  }

  if (data?.RetStatus === 1 || data?.retStatus === 1) {
    return { success: true, recId: String(data.Value ?? data.value ?? 'ok') };
  }

  return interpretResult(String(raw).trim());
}

function interpretResult(resultRaw) {
  if (resultRaw == null) {
    return { success: false, error: 'پاسخ خالی از ملی‌پیامک' };
  }
  const cleaned = String(resultRaw).trim();

  // recId موفق: عدد یکتا بیش از ۱۵ رقم
  if (/^\d{15,}$/.test(cleaned)) {
    return { success: true, recId: cleaned };
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length >= 15) {
    return { success: true, recId: digits };
  }

  const numKey = Number(cleaned);
  const message =
    ERROR_CODES[cleaned] ||
    ERROR_CODES[numKey] ||
    ERROR_CODES[String(numKey)] ||
    `خطای ملی‌پیامک: ${cleaned || 'نامشخص'}`;

  return { success: false, error: message, code: cleaned };
}

/**
 * @param {string} to
 * @param {SmsPattern} pattern
 * @param {string[]} vars
 * @param {{ businessId?: string }} opts
 */
export async function sendSms(to, pattern, vars = [], opts = {}) {
  const provider = new MelipayamakProvider();
  const result = await provider.sendByPattern(to, pattern, vars);
  // async log - don't block failure
  try {
    const { db } = await import('@/db');
    const { smsLogs } = await import('@/db/schema/saas');
    const rec = result.recId || (result.success ? 'ok' : null);
    await db.insert(smsLogs).values({
      businessId: opts.businessId || null,
      phone: normalizeSmsRecipient(to) || String(to),
      pattern,
      bodyId: String(provider.getBodyId(pattern) || ''),
      status: result.success ? 'sent' : 'failed',
      providerRef: rec ? String(rec).slice(0, 120) : (result.error || '').slice(0, 120),
    });
  } catch (e) {
    console.warn('[sms] log failed', e?.message);
  }
  return result;
}

/**
 * @param {string} to
 * @param {string|number} code
 * @param {{ businessId?: string }} opts
 */
export async function sendOtpSms(to, code, opts = {}) {
  return sendSms(to, 'otp', [String(code)], opts);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export { PATTERN_ENV_KEYS, ERROR_CODES };
