'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Gift, Loader2, KeyRound, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function UnifiedAuth({ defaultRole = 'business_owner' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const ref = searchParams.get('ref');

  const [step, setStep] = useState('phone');
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

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا در ارسال کد');
        return;
      }
      setIsNewUser(data.isNewUser);
      if (data.isNewUser) {
        setInfo('شماره جدید است — کد تأیید ۵ رقمی ارسال شد');
        setStep('otp');
      } else {
        setInfo('کد تأیید ارسال شد — روش ورود را انتخاب کن');
        setStep('chooseMethod');
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function pushSessionToMainIfNeeded() {
    try {
      const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      let mainOrigin;
      try { mainOrigin = new URL(mainAppUrl).origin; } catch { mainOrigin = 'http://localhost:3001'; }
      const currentOrigin = window.location.origin;
      if (currentOrigin === mainOrigin) return;
      const tokenRes = await fetch('/api/auth/token', { credentials: 'include', cache: 'no-store' });
      if (!tokenRes.ok) return;
      const tokenJson = await tokenRes.json().catch(() => ({}));
      if (!tokenJson.ok || !tokenJson.token) return;
      await fetch(`${mainOrigin}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({ token: tokenJson.token }),
      });
      try { sessionStorage.setItem('nobatet_sso_pushed_to_main', '1'); } catch {}
    } catch {}
  }

  async function getEffectiveNext() {
    try {
      const paramsNext = new URLSearchParams(window.location.search).get('next');
      const raw = nextPath || paramsNext || '/';
      let effectiveNext = raw;
      try { effectiveNext = decodeURIComponent(raw); } catch {}
      const isAbsolute = /^https?:\/\//i.test(effectiveNext);
      if (isAbsolute) return { url: effectiveNext, isExternal: true };
      if (['/business','/staff','/visitor','/admin'].some(p => effectiveNext.startsWith(p))) {
        try {
          const wsRes = await fetch('/api/auth/workspaces', { credentials: 'include', cache: 'no-store' });
          const wsData = await wsRes.json();
          if (wsData.ok && wsData.total > 1 && ['/business','/staff','/visitor','/admin'].includes(effectiveNext)) {
            return { url: '/choose-workspace', isExternal: false };
          }
        } catch {}
      }
      return { url: effectiveNext, isExternal: false };
    } catch { return { url: '/', isExternal: false }; }
  }

  function doRedirect(dest) {
    if (!dest) dest = { url: '/', isExternal: false };
    if (dest.isExternal) window.location.href = dest.url;
    else { router.push(dest.url); router.refresh(); }
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
      await pushSessionToMainIfNeeded();
      let dest = await getEffectiveNext();
      if (ref && dest.url === '/' && !dest.isExternal) dest.url = `/?ref=${ref}`;
      doRedirect(dest);
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
      await pushSessionToMainIfNeeded();
      const dest = await getEffectiveNext();
      doRedirect(dest);
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
      await pushSessionToMainIfNeeded();
      const dest = await getEffectiveNext();
      doRedirect(dest);
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function handleResetRequest() {
    setError(''); setInfo(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'reset_password' }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setInfo('کد بازیابی ارسال شد');
      setStep('otp');
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-[#F0F9FF] via-white to-[#EFF7FB] px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border border-[#E0F0F8] bg-white/80 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-white flex items-center justify-center font-lalezar text-xl shadow-lg" style={{ fontFamily: 'var(--font-lalezar)' }}>ن</div>
          <CardTitle className="mt-4 font-lalezar text-[18px] tracking-tight">
            {step === 'phone' && 'ورود یا ثبت‌نام'}
            {step === 'chooseMethod' && 'روش ورود را انتخاب کن'}
            {step === 'otp' && (isNewUser ? 'ثبت‌نام — تأیید شماره' : 'ورود — کد پیامکی')}
            {step === 'password' && 'ورود با رمز عبور'}
            {step === 'profile' && 'تکمیل ثبت‌نام'}
          </CardTitle>
          <CardDescription className="leading-6 text-[12px]">
            {step === 'phone' && 'ابتدا شماره موبایلت را وارد کن'}
            {step === 'chooseMethod' && `شماره ${phone} قبلا ثبت شده — با پیامک یا رمز وارد شو`}
            {step === 'otp' && `کد ۵ رقمی به ${phone} ارسال شد`}
            {step === 'password' && `رمز عبور حساب ${phone}`}
            {step === 'profile' && 'اطلاعاتت رو کامل کن'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3" noValidate>
              <Input label="شماره موبایل" type="tel" inputMode="tel" dir="ltr" placeholder="0912..." value={phone} onChange={(e)=>setPhone(e.target.value)} required autoFocus autoComplete="tel" />
              <p className="text-[10px] text-muted-foreground -mt-2">شماره ایرانی با 09</p>
              <Button type="submit" className="w-full h-11 text-[13px] rounded-xl" loading={loading}>ادامه ←</Button>
              {ref && <p className="text-[11px] text-center glass p-2 rounded-xl flex items-center justify-center gap-1"><Gift className="size-3" /> کد معرف: <span className="font-mono font-medium">{ref}</span></p>}
            </form>
          )}

          {step === 'chooseMethod' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-[11px] text-teal-800">کد پیامکی ارسال شد — می‌توانی با کد وارد شوی یا با رمز عبور</div>
              <Button type="button" className="w-full h-11 rounded-xl text-[13px] flex items-center justify-center gap-2" onClick={()=>setStep('otp')}>
                <MessageSquare className="size-4" /> ورود با کد پیامکی
              </Button>
              <Button type="button" variant="secondary" className="w-full h-10 rounded-xl text-[13px] flex items-center justify-center gap-2" onClick={()=>setStep('password')}>
                <KeyRound className="size-4" /> ورود با رمز عبور
              </Button>
              <button className="text-[11px] text-muted-foreground w-full hover:text-primary" onClick={()=>{setStep('phone'); setCode('');}}>تغییر شماره</button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-3">
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <Input label="کد تأیید ۵ رقمی" inputMode="numeric" dir="ltr" maxLength={6} placeholder="12345" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} required autoFocus />
                <Button type="submit" className="w-full h-11" loading={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : 'تأیید و ادامه'}</Button>
              </form>
              {!isNewUser && (
                <div className="flex gap-2 pt-2 border-t border-white/40">
                  <Button type="button" variant="secondary" className="flex-1 h-10 text-[12px]" onClick={()=>setStep('password')}>ورود با رمز</Button>
                  <Button type="button" variant="ghost" className="flex-1 h-10 text-[12px]" onClick={handleResetRequest} disabled={loading}>بازیابی رمز</Button>
                </div>
              )}
              <button className="text-[11px] text-muted-foreground w-full hover:text-primary" onClick={()=>{setStep('phone'); setCode('');}}>تغییر شماره</button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <Input label="شماره موبایل" dir="ltr" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
              <Input label="رمز عبور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <Button type="submit" className="w-full h-11" loading={loading}>ورود</Button>
              <div className="flex justify-between text-[11px]">
                <button type="button" onClick={()=>setStep('chooseMethod')} className="text-muted-foreground hover:text-primary">برگشت به انتخاب روش</button>
                <button type="button" onClick={handleResetRequest} className="text-primary font-medium hover:underline">فراموشی رمز؟</button>
              </div>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleCompleteProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="نام" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
                <Input label="نام خانوادگی" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
              </div>
              <Input label="رمز عبور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} hint="حداقل ۶ کاراکتر" />
              <div className="space-y-2">
                <p className="text-[12px] font-medium">نوع حساب</p>
                {[
                  { id:'business_owner', label:'صاحب کسب‌وکار', desc:'پنل مدیریت + لندینگ' },
                  { id:'customer', label:'مشتری', desc:'رزرو نوبت' },
                  { id:'visitor', label:'ویزیتور', desc:'کسب کمیسیون' },
                ].map((opt)=>(
                  <label key={opt.id} className={cn('flex items-start gap-2 rounded-xl border p-2.5 cursor-pointer', role===opt.id?'border-primary bg-teal-50/60':'border-white/40 glass-card')}>
                    <input type="radio" name="role" value={opt.id} checked={role===opt.id} onChange={()=>setRole(opt.id)} className="mt-1 accent-teal-600" />
                    <span><span className="block text-[12px] font-medium">{opt.label}</span><span className="block text-[10px] text-muted-foreground">{opt.desc}</span></span>
                  </label>
                ))}
              </div>
              <Button type="submit" className="w-full h-11" loading={loading}>ساخت حساب و ورود</Button>
            </form>
          )}

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}
          {info && !error && <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[12px] text-teal-800">{info}</div>}

          <div className="pt-3 border-t border-white/40 text-center text-[10px] text-muted-foreground">
            با ادامه، <Link href="/pricing" className="text-primary underline">قوانین</Link> را می‌پذیری
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
