'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/**
 * فرم یکپارچه ورود/ثبت‌نام با OTP و رمز عبور
 * @param {{ mode?: 'login' | 'register', defaultRole?: string }} props
 */
export function AuthForm({ mode = 'login', defaultRole = 'customer' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [method, setMethod] = useState('otp'); // otp | password
  const [step, setStep] = useState('phone'); // phone | otp | profile | reset
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const purpose =
        mode === 'register'
          ? 'register'
          : step === 'reset'
            ? 'reset_password'
            : 'login';

      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا در ارسال کد');
        return;
      }
      setInfo('کد تأیید پیامک شد');
      setStep(purpose === 'reset_password' ? 'otp-reset' : 'otp');
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const purpose =
        step === 'otp-reset'
          ? 'reset_password'
          : mode === 'register'
            ? 'register'
            : 'login';

      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, purpose }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'تأیید ناموفق');
        return;
      }

      if (data.needsProfile) {
        setVerificationToken(data.verificationToken);
        setStep('profile');
        return;
      }

      if (data.needsPasswordReset) {
        setVerificationToken(data.verificationToken);
        setStep('new-password');
        return;
      }

      router.push(nextPath || data.redirectTo || '/me');
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          firstName,
          lastName,
          password,
          role,
          verificationToken,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ثبت‌نام ناموفق');
        return;
      }
      router.push(nextPath || data.redirectTo || '/me');
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ورود ناموفق');
        return;
      }
      router.push(nextPath || data.redirectTo || '/me');
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, verificationToken }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'تغییر رمز ناموفق');
        return;
      }
      router.push(data.redirectTo || '/me');
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    phone: mode === 'register' ? 'ثبت‌نام در نوبتت' : 'ورود به نوبتت',
    otp: 'تأیید کد پیامکی',
    'otp-reset': 'تأیید کد فراموشی رمز',
    profile: 'تکمیل اطلاعات',
    'new-password': 'رمز عبور جدید',
  };

  const descriptions = {
    phone:
      mode === 'register'
        ? 'با شماره موبایل حساب بسازید — بدون نیاز به ایمیل'
        : 'با کد پیامکی یا رمز عبور وارد شوید',
    otp: `کد ۵ رقمی ارسال‌شده به ${phone} را وارد کنید`,
    'otp-reset': `کد ارسال‌شده به ${phone} را وارد کنید`,
    profile: 'نام و رمز عبور خود را تنظیم کنید',
    'new-password': 'رمز عبور جدید را وارد کنید',
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{titles[step] || titles.phone}</CardTitle>
        <CardDescription>{descriptions[step] || descriptions.phone}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' && method === 'otp' && (
          <>
            {mode === 'login' && (
              <div className="flex rounded-xl bg-muted p-1 text-sm">
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-lg py-2 font-medium transition-colors',
                    method === 'otp' ? 'bg-white shadow-sm' : 'text-muted-foreground',
                  )}
                  onClick={() => setMethod('otp')}
                >
                  کد پیامکی
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-lg py-2 font-medium transition-colors',
                    method === 'password' ? 'bg-white shadow-sm' : 'text-muted-foreground',
                  )}
                  onClick={() => setMethod('password')}
                >
                  رمز عبور
                </button>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="شماره موبایل"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
              <Button type="submit" className="w-full" loading={loading}>
                دریافت کد تأیید
              </Button>
            </form>

            {mode === 'login' && (
              <button
                type="button"
                className="text-sm text-primary hover:underline w-full text-center"
                onClick={() => {
                  setStep('reset');
                  setMethod('otp');
                }}
              >
                فراموشی رمز عبور
              </button>
            )}
          </>
        )}

        {step === 'phone' && method === 'password' && (
          <>
            <div className="flex rounded-xl bg-muted p-1 text-sm">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-lg py-2 font-medium transition-colors',
                  method === 'otp' ? 'bg-white shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setMethod('otp')}
              >
                کد پیامکی
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-lg py-2 font-medium transition-colors',
                  method === 'password' ? 'bg-white shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setMethod('password')}
              >
                رمز عبور
              </button>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="شماره موبایل"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="رمز عبور"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" loading={loading}>
                ورود
              </Button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="شماره موبایل"
              name="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="09123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              ارسال کد بازیابی
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary w-full"
              onClick={() => setStep('phone')}
            >
              بازگشت
            </button>
          </form>
        )}

        {(step === 'otp' || step === 'otp-reset') && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="کد تأیید"
              name="code"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="12345"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
            <Button type="submit" className="w-full" loading={loading}>
              تأیید
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary w-full"
              onClick={() => {
                setStep('phone');
                setCode('');
              }}
            >
              تغییر شماره
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="نام"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="نام خانوادگی"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="رمز عبور"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              hint="حداقل ۶ کاراکتر"
            />

            {mode === 'register' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">نوع حساب</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'business_owner', label: 'صاحب کسب‌وکار', desc: 'پنل مدیریت و رزرو' },
                    { id: 'customer', label: 'مشتری', desc: 'رزرو نوبت' },
                    { id: 'visitor', label: 'ویزیتور / بازاریاب', desc: 'جذب بیزنس و کمیسیون' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                        role === opt.id
                          ? 'border-primary bg-teal-50'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.id}
                        checked={role === opt.id}
                        onChange={() => setRole(opt.id)}
                        className="mt-1 accent-teal-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {opt.desc}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              ساخت حساب
            </Button>
          </form>
        )}

        {step === 'new-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="رمز عبور جدید"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" loading={loading}>
              ذخیره و ورود
            </Button>
          </form>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
            {info}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground pt-2">
          {mode === 'login' ? (
            <>
              حساب ندارید؟{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                ثبت‌نام
              </Link>
            </>
          ) : (
            <>
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                ورود
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
