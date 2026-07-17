'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function UnifiedAuth({ defaultRole = 'business_owner' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const ref = searchParams.get('ref');
  const plan = searchParams.get('plan');

  const [step, setStep] = useState('phone'); // phone | otp | password | profile | reset | new-password
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [verificationToken, setVerificationToken] = useState('');
  const [isNewUser, setIsNewUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordOption, setShowPasswordOption] = useState(false);

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در ارسال کد'); return; }
      setIsNewUser(data.isNewUser);
      setInfo(data.isNewUser ? 'شماره جدید است — کد تأیید ارسال شد (ثبت‌نام)' : 'کد تأیید ارسال شد — برای ورود کد را وارد کنید');
      setShowPasswordOption(!data.isNewUser);
      setStep('otp');
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function resolveDestination(fallback) {
    try {
      const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include' });
      const wsData = await wsRes.json();
      if (wsData.ok) {
        if (wsData.total > 1 && !nextPath) {
          return '/choose-workspace';
        }
        if (wsData.total === 1) {
          return wsData.dashboards[0].href;
        }
      }
    } catch {}
    return fallback;
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, purpose: 'login' }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'تأیید ناموفق'); return; }
      if (data.needsProfile) { setVerificationToken(data.verificationToken); setStep('profile'); return; }
      if (data.needsPasswordReset) { setVerificationToken(data.verificationToken); setStep('new-password'); return; }
      let redirect = nextPath || data.redirectTo || '/me';
      if (ref && !redirect.includes('ref')) redirect += (redirect.includes('?') ? '&' : '?') + `ref=${ref}`;
      redirect = await resolveDestination(redirect);
      router.push(redirect);
      router.refresh();
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ورود ناموفق'); return; }
      let redirect = nextPath || data.redirectTo || '/me';
      redirect = await resolveDestination(redirect);
      router.push(redirect);
      router.refresh();
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function handleCompleteProfile(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, firstName, lastName, password, role, verificationToken, referralCode: ref || undefined }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت‌نام ناموفق'); return; }
      let redirect = nextPath || data.redirectTo || '/me';
      redirect = await resolveDestination(redirect);
      router.push(redirect);
      router.refresh();
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function handleResetRequest() {
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'reset_password' }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setInfo('کد بازیابی ارسال شد');
      setStep('otp-reset');
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg">ن</div>
          <CardTitle className="mt-4 text-xl">
            {step === 'phone' && 'ورود یا ثبت‌نام'}
            {step === 'otp' && (isNewUser ? 'ثبت‌نام — تأیید شماره' : 'ورود — کد پیامکی')}
            {step === 'password' && 'ورود با رمز عبور'}
            {step === 'profile' && 'تکمیل ثبت‌نام'}
            {step === 'otp-reset' && 'بازیابی رمز — کد تأیید'}
            {step === 'new-password' && 'رمز جدید'}
          </CardTitle>
          <CardDescription className="leading-6">
            {step === 'phone' && 'شماره موبایلت رو وارد کن — اگر جدید باشی ثبت‌نام، اگر قبلا بودی ورود'}
            {step === 'otp' && `کد ۵ رقمی به ${phone} ارسال شد`}
            {step === 'password' && `ورود با رمز برای ${phone}`}
            {step === 'profile' && 'اطلاعاتت رو کامل کن تا حساب ساخته شود'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <Input label="شماره موبایل" type="tel" inputMode="tel" dir="ltr" placeholder="0912..." value={phone} onChange={(e)=>setPhone(e.target.value)} required autoFocus />
              <Button type="submit" className="w-full h-11 text-base" loading={loading}>ادامه با پیامک →</Button>
              <div className="relative py-2"><div className="absolute inset-0 top-1/2 h-px bg-border" /><span className="relative bg-white px-2 text-[11px] text-muted-foreground mx-auto block w-fit">یا</span></div>
              <Button type="button" variant="secondary" className="w-full" onClick={()=>setStep('password')}>ورود با رمز عبور</Button>
              {ref && <p className="text-[11px] text-center bg-amber-50 border border-amber-200 rounded-lg py-1.5">🎁 کد معرف: <span className="font-mono font-bold">{ref}</span></p>}
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input label="کد تأیید ۵ رقمی" inputMode="numeric" dir="ltr" maxLength={6} placeholder="12345" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} required autoFocus />
                <Button type="submit" className="w-full" loading={loading}>تأیید و ادامه</Button>
              </form>
              {showPasswordOption && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-center text-muted-foreground">رمزت یادت نیست؟</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={()=>setStep('password')}>ورود با رمز</Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleResetRequest} disabled={loading}>ارسال کد بازیابی</Button>
                  </div>
                </div>
              )}
              <button className="text-xs text-muted-foreground w-full hover:text-primary" onClick={()=>{setStep('phone'); setCode('');}}>تغییر شماره موبایل</button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input label="شماره موبایل" dir="ltr" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
              <Input label="رمز عبور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" loading={loading}>ورود</Button>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={()=>setStep('phone')} className="text-muted-foreground hover:text-primary">ورود با کد پیامکی</button>
                <button type="button" onClick={handleResetRequest} className="text-primary font-bold hover:underline">فراموشی رمز؟</button>
              </div>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="نام" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
                <Input label="نام خانوادگی" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
              </div>
              <Input label="رمز عبور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} hint="حداقل ۶ کاراکتر" />
              <div className="space-y-2">
                <p className="text-sm font-medium">نوع حساب</p>
                {[
                  { id:'business_owner', label:'صاحب کسب‌وکار', desc:'پنل مدیریت + لندینگ اختصاصی' },
                  { id:'customer', label:'مشتری', desc:'رزرو نوبت' },
                  { id:'visitor', label:'ویزیتور/بازاریاب', desc:'کسب کمیسیون' },
                ].map((opt)=>(
                  <label key={opt.id} className={cn('flex items-start gap-3 rounded-xl border p-3 cursor-pointer', role===opt.id?'border-primary bg-teal-50':'border-border hover:bg-muted')}>
                    <input type="radio" name="role" value={opt.id} checked={role===opt.id} onChange={()=>setRole(opt.id)} className="mt-1 accent-teal-600" />
                    <span><span className="block text-sm font-bold">{opt.label}</span><span className="block text-xs text-muted-foreground">{opt.desc}</span></span>
                  </label>
                ))}
              </div>
              <Button type="submit" className="w-full" loading={loading}>ساخت حساب و ورود</Button>
              {ref && <p className="text-xs text-center text-muted-foreground">با کد معرف {ref} ثبت‌نام می‌کنید</p>}
            </form>
          )}

          {step === 'otp-reset' && (
            <form onSubmit={async (e)=>{ e.preventDefault(); setError(''); setLoading(true); try{ const res=await fetch('/api/auth/otp/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code,purpose:'reset_password'})}); const data=await res.json(); if(!data.ok){setError(data.error);} else { setVerificationToken(data.verificationToken); setStep('new-password'); } } catch{ setError('خطای شبکه'); } finally{ setLoading(false);} }} className="space-y-4">
              <Input label="کد بازیابی" dir="ltr" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} required />
              <Button type="submit" className="w-full" loading={loading}>تأیید</Button>
            </form>
          )}

          {step === 'new-password' && (
            <form onSubmit={async (e)=>{ e.preventDefault(); setLoading(true); setError(''); try{ const res=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,password,verificationToken})}); const data=await res.json(); if(!data.ok)setError(data.error); else { router.push(data.redirectTo||'/me'); router.refresh(); } } catch{ setError('خطا'); } finally{ setLoading(false);} }} className="space-y-4">
              <Input label="رمز جدید" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" loading={loading}>ذخیره و ورود</Button>
            </form>
          )}

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {info && !error && <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{info}</div>}

          <div className="pt-4 border-t text-center text-[11px] text-muted-foreground">
            با ادامه، <Link href="/pricing" className="text-primary underline">قوانین و حریم خصوصی</Link> را می‌پذیرید
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
