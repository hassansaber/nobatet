import { eq, and, gt, desc } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/db';
import { users, otpCodes } from '@/db/schema/users';
import {
  createSession,
  destroySession,
  buildSessionPayload,
  dashboardPathForSession,
  hashPassword,
  comparePassword,
  getSession,
  incrementTokenVersion,
} from '@/lib/auth';
import { generateOtp, normalizeIranPhone } from '@/lib/utils';
import { sendOtpSms } from '@/services/sms';

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_MS = 60 * 1000;

export async function requestOtp(phoneRaw, purpose = 'login') {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const recent = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.isUsed, false)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (recent[0]) {
    const age = Date.now() - new Date(recent[0].createdAt).getTime();
    if (age < OTP_RATE_LIMIT_MS) {
      const waitSec = Math.ceil((OTP_RATE_LIMIT_MS - age) / 1000);
      return { ok: false, error: `لطفاً ${waitSec} ثانیه دیگر دوباره تلاش کنید` };
    }
  }

  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
  const isNewUser = existingUser.length === 0;

  const code = generateOtp(5);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(otpCodes).values({ phone, code, purpose, expiresAt });

  const smsResult = await sendOtpSms(phone, code);
  if (!smsResult.success) {
    return { ok: false, error: smsResult.error || 'ارسال پیامک ناموفق بود' };
  }

  return { ok: true, phone, isNewUser, expiresInSeconds: Math.floor(OTP_TTL_MS / 1000) };
}

export async function verifyOtp(phoneRaw, code, purpose = 'login') {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.isUsed, false), eq(otpCodes.purpose, purpose), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const otp = rows[0];
  if (!otp) return { ok: false, error: 'کد تأیید منقضی یا نامعتبر است' };

  const attempts = Number(otp.attempts || '0');
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otp.id));
    return { ok: false, error: 'تعداد تلاش بیش از حد مجاز. کد جدید بگیرید' };
  }

  if (otp.code !== String(code).trim()) {
    await db.update(otpCodes).set({ attempts: String(attempts + 1) }).where(eq(otpCodes.id, otp.id));
    return { ok: false, error: 'کد تأیید اشتباه است' };
  }

  await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otp.id));

  const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  const user = existing[0];

  if (!user) {
    return { ok: true, needsProfile: true, phone, verificationToken: await createVerificationToken(phone) };
  }

  if (!user.isActive) return { ok: false, error: 'حساب کاربری غیرفعال است' };

  if (!user.isPhoneVerified) {
    await db.update(users).set({ isPhoneVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id));
  }

  if (purpose === 'reset_password') {
    return { ok: true, needsPasswordReset: true, phone, verificationToken: await createVerificationToken(phone) };
  }

  await createSession(user.id);
  const payload = await buildSessionPayload(user.id);
  const redirectTo = dashboardPathForSession(payload);

  return { ok: true, needsProfile: false, user: publicUser(user), redirectTo, session: payload };
}

export async function completeRegistration(data) {
  const phone = normalizeIranPhone(data.phone);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const valid = await verifyVerificationToken(data.verificationToken, phone);
  if (!valid) return { ok: false, error: 'نشست تأیید منقضی شده. دوباره وارد شوید' };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
  if (existing[0]) return { ok: false, error: 'این شماره قبلاً ثبت شده است' };

  const role = ['customer', 'business_owner', 'visitor'].includes(data.role) ? data.role : 'customer';
  const passwordHash = await hashPassword(data.password);

  const inserted = await db
    .insert(users)
    .values({
      phone,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      passwordHash,
      role,
      isPhoneVerified: true,
    })
    .returning();

  const user = inserted[0];

  // اگر نقش visitor یا super_admin بود، در user_roles هم ثبت کن
  if (role === 'visitor' || role === 'super_admin') {
    try {
      const { userRoles } = await import('@/db/schema/user-roles.js');
      await db.insert(userRoles).values({ userId: user.id, role }).onConflictDoNothing();
    } catch {}
  }

  // اگر referralCode داشت، visitor را لینک کن (provision در business-service انجام می‌شود اگر بیزنس بسازد)
  if (data.referralCode) {
    // ذخیره موقت؟ در حال حاضر فقط برای بیزنس استفاده می‌شود
  }

  await createSession(user.id);
  const payload = await buildSessionPayload(user.id);
  const redirectTo = dashboardPathForSession(payload);

  return { ok: true, user: publicUser(user), redirectTo, session: payload };
}

export async function loginWithPassword(phoneRaw, password) {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  const user = rows[0];
  if (!user || !user.passwordHash) return { ok: false, error: 'شماره یا رمز عبور اشتباه است' };
  if (!user.isActive) return { ok: false, error: 'حساب کاربری غیرفعال است' };

  const match = await comparePassword(password, user.passwordHash);
  if (!match) return { ok: false, error: 'شماره یا رمز عبور اشتباه است' };

  await createSession(user.id);
  const payload = await buildSessionPayload(user.id);
  const redirectTo = dashboardPathForSession(payload);

  return { ok: true, user: publicUser(user), redirectTo, session: payload };
}

export async function resetPassword({ phone: phoneRaw, password, verificationToken }) {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: false, error: 'شماره موبایل معتبر نیست' };

  const valid = await verifyVerificationToken(verificationToken, phone);
  if (!valid) return { ok: false, error: 'نشست تأیید منقضی شده. دوباره تلاش کنید' };

  const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  const user = rows[0];
  if (!user) return { ok: false, error: 'کاربر یافت نشد' };

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
  await incrementTokenVersion(user.id);

  await createSession(user.id);
  const payload = await buildSessionPayload(user.id);
  const redirectTo = dashboardPathForSession(payload);

  return { ok: true, user: publicUser(user), redirectTo, session: payload };
}

export async function logout() {
  await destroySession();
  return { ok: true };
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.sub)).limit(1);
  const user = rows[0];
  if (!user || !user.isActive) return null;
  return publicUser(user);
}

function publicUser(user) {
  return {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
    tokenVersion: user.tokenVersion ?? 0,
  };
}

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev');
}

async function createVerificationToken(phone) {
  return new SignJWT({ phone, typ: 'phone_verified' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('15m').sign(secret());
}

async function verifyVerificationToken(token, phone) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.typ === 'phone_verified' && payload.phone === phone;
  } catch {
    return false;
  }
}
