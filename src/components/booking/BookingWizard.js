'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, User, Calendar, Clock, UserCheck, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatRial } from '@/lib/utils';
import { formatTehranDateTime } from '@/lib/datetime';

export function BookingWizard({ business, primaryColor = '#0284C7' }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('sandbox');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardState, setCardState] = useState(null);
  const [cardLast4, setCardLast4] = useState('');
  const [cardTransferCode, setCardTransferCode] = useState('');
  const [cardTransferNote, setCardTransferNote] = useState('');
  const [result, setResult] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Guest flow states (وقتی لاگین نیست)
  const [guestStep, setGuestStep] = useState('phone'); // phone | otp | profile
  const [guestPhone, setGuestPhone] = useState('');
  const [guestOtp, setGuestOtp] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestVerificationToken, setGuestVerificationToken] = useState('');
  const [guestInfo, setGuestInfo] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const service = useMemo(() => business.services.find((s) => s.id === serviceId), [business.services, serviceId]);
  const staffMember = useMemo(() => business.staff.find((s) => s.id === memberId), [business.staff, memberId]);
  const hasCard = Boolean(business.cardNumber);

  const dateOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      const value = `${y}-${m}-${day}`;
      opts.push({ value, label: d.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'short', month: 'short', day: 'numeric' }) });
    }
    const seen = new Set();
    return opts.filter((o) => { if (seen.has(o.value)) return false; seen.add(o.value); return true; });
  }, []);

  const hasPrefilledRef = useRef(false);

  const fetchUser = useCallback(async () => {
    const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setSessionUser(data.user);
          const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
          if (fullName) setCustomerName((prev) => prev || fullName);
          if (data.user.phone) {
            setCustomerPhone((prev) => prev || data.user.phone);
            setGuestPhone((prev) => prev || data.user.phone);
          }
          hasPrefilledRef.current = true;
          setUserLoaded(true);
          return data.user;
        }
      }
      // fallback to main domain SSO
      try {
        const fbRes = await fetch(`${mainDomain}/api/auth/me`, { cache: 'no-store', credentials: 'include', mode: 'cors' });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (fbData.ok && fbData.user) {
            setSessionUser(fbData.user);
            const fullName = [fbData.user.firstName, fbData.user.lastName].filter(Boolean).join(' ').trim();
            if (fullName) setCustomerName((prev) => prev || fullName);
            if (fbData.user.phone) {
              setCustomerPhone((prev) => prev || fbData.user.phone);
              setGuestPhone((prev) => prev || fbData.user.phone);
            }
            hasPrefilledRef.current = true;
            // sync token to this subdomain
            try {
              const tokenRes = await fetch(`${mainDomain}/api/auth/token`, { cache: 'no-store', credentials: 'include', mode: 'cors' });
              if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                if (tokenData.ok && tokenData.token) {
                  await fetch('/api/auth/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenData.token }) });
                }
              }
            } catch {}
            setUserLoaded(true);
            return fbData.user;
          }
        }
      } catch {}
    } catch {} finally { setUserLoaded(true); }
    return null;
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  // اگر کاربر لاگین است و به مرحله 5 می‌آید اما فیلدها خالی مانده (race condition قدیمی)، دوباره پر کن
  useEffect(() => {
    if (step === 5 && sessionUser && !hasPrefilledRef.current) {
      const fullName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim();
      if (fullName && !customerName) setCustomerName(fullName);
      if (sessionUser.phone && !customerPhone) setCustomerPhone(sessionUser.phone);
      if (sessionUser.phone && !guestPhone) setGuestPhone(sessionUser.phone);
    }
  }, [step, sessionUser, customerName, customerPhone, guestPhone]);

  // اگر سشن بعداً آمد (بعد از mount) فیلدها را پر کن - حتی اگر کاربر سریع خدمت را انتخاب کرده باشد
  useEffect(() => {
    if (sessionUser) {
      const fullName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim();
      if (fullName && !customerName) setCustomerName(fullName);
      if (sessionUser.phone && !customerPhone) setCustomerPhone(sessionUser.phone);
    }
  }, [sessionUser]);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setSlotsLoading(true); setError(''); setSlot(null);
    try {
      const params = new URLSearchParams({ businessId: business.id, serviceId, date });
      if (memberId) params.set('memberId', memberId);
      const res = await fetch(`/api/public/slots?${params}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در دریافت تایم‌ها'); setSlots([]); return; }
      setSlots(data.slots || []);
    } catch { setError('ارتباط با سرور برقرار نشد'); setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [business.id, serviceId, date, memberId]);

  useEffect(() => { if (step === 4) loadSlots(); }, [step, loadSlots]);

  async function submitBooking() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, serviceId, memberId: memberId || slot?.memberId || null, startsAt: slot.startsAt, customerName, customerPhone, policyAccepted, notes: notes || null, paymentMethod }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت رزرو ناموفق بود'); return; }
      if (data.needsGateway && data.redirectUrl) { router.push(data.redirectUrl); return; }
      if (data.needsCardTransfer) { setCardState(data); setStep(8); return; }
      setResult(data); setStep(7);
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function submitCardProof() {
    if (!cardState?.booking?.id) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/public/payments/card-to-card', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cardState.booking.id, sourceCardLast4: cardLast4, transferCode: cardTransferCode, transferNote: cardTransferNote, transferReportedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت رسید ناموفق'); return; }
      setResult({ ...cardState, booking: { ...cardState.booking, status: 'pending_payment' }, cardSubmitted: true, message: data.message });
      setStep(7);
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  // Guest flow handlers
  async function handleGuestRequestOtp() {
    if (!guestPhone) { setError('شماره موبایل را وارد کنید'); return; }
    setGuestLoading(true); setError(''); setGuestInfo('');
    try {
      const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: guestPhone, purpose: 'login' }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ارسال کد ناموفق'); return; }
      setGuestInfo(data.isNewUser ? 'کد تأیید برای ثبت‌نام ارسال شد' : 'کد ورود ارسال شد');
      setGuestStep('otp');
    } catch { setError('ارتباط برقرار نشد'); } finally { setGuestLoading(false); }
  }

  async function handleGuestVerifyOtp() {
    if (!guestOtp) { setError('کد را وارد کنید'); return; }
    setGuestLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: guestPhone, code: guestOtp, purpose: 'login' }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'کد اشتباه'); return; }
      if (data.needsProfile) {
        setGuestVerificationToken(data.verificationToken);
        setGuestStep('profile');
        setGuestInfo('شماره تأیید شد — نام و نام خانوادگی را وارد کنید تا ثبت‌نام تکمیل و به پرداخت بروید');
      } else {
        // کاربر موجود لاگین شد
        setSessionUser(data.user);
        const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
        if (fullName) setCustomerName(fullName);
        setCustomerPhone(data.user.phone || guestPhone);
        setGuestInfo('ورود موفق — در حال انتقال به پرداخت...');
        setTimeout(() => setStep(6), 600);
      }
    } catch { setError('خطای شبکه'); } finally { setGuestLoading(false); }
  }

  async function handleGuestCompleteProfile() {
    if (!guestFirstName.trim() || !guestLastName.trim()) { setError('نام و نام خانوادگی الزامی است'); return; }
    if (!guestPassword || guestPassword.length < 6) { setError('رمز عبور حداقل ۶ کاراکتر'); return; }
    setGuestLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: guestPhone, firstName: guestFirstName, lastName: guestLastName, password: guestPassword, role: 'customer', verificationToken: guestVerificationToken }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت‌نام ناموفق'); return; }
      // ثبت‌نام موفق → سشن ساخته شد
      setSessionUser(data.user);
      setCustomerName(`${guestFirstName} ${guestLastName}`.trim());
      setCustomerPhone(guestPhone);
      setGuestInfo('ثبت‌نام موفق — انتقال به پرداخت...');
      await fetchUser();
      setTimeout(() => setStep(6), 800);
    } catch { setError('خطای شبکه'); } finally { setGuestLoading(false); }
  }

  function resetAll() {
    setResult(null); setCardState(null); setStep(1); setServiceId(''); setMemberId(''); setDate(''); setSlot(null); setPolicyAccepted(false); setPaymentMethod('sandbox'); setCardLast4(''); setCardTransferCode(''); setCardTransferNote('');
    setGuestStep('phone'); setGuestPhone(''); setGuestOtp(''); setGuestFirstName(''); setGuestLastName(''); setGuestPassword(''); setGuestVerificationToken(''); setGuestInfo('');
  }

  // خلاصه اطلاعات فعلی برای نمایش پیشرونده
  const summaryItems = [
    { key: 'service', label: 'خدمت', value: service?.name, done: !!serviceId, Icon: Scissors, color: '#EF4444' },
    { key: 'staff', label: 'کارمند', value: staffMember?.name || (memberId ? '—' : 'بدون ترجیح'), done: step > 2, Icon: User, color: '#F97316' },
    { key: 'date', label: 'تاریخ', value: date ? new Date(date).toLocaleDateString('fa-IR') : null, done: !!date, Icon: Calendar, color: '#F59E0B' },
    { key: 'time', label: 'ساعت', value: slot ? slot.start : null, done: !!slot, Icon: Clock, color: '#0284C7' },
    { key: 'customer', label: 'مشتری', value: customerName ? `${customerName} • ${customerPhone}` : null, done: !!customerName && !!customerPhone, Icon: UserCheck, color: '#7C3AED' },
  ];

  const stepColors = {
    1: '#EF4444',
    2: '#F97316',
    3: '#F59E0B',
    4: '#0284C7',
    5: '#7C3AED',
    6: '#059669',
  };

  if (result && step === 7) {
    const b = result.booking;
    const pending = b.status === 'pending_payment' || result.cardSubmitted;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn('rounded-[1.5rem] border p-8 text-center space-y-4 backdrop-blur-xl', pending ? 'border-amber-200 bg-amber-50/70' : 'border-teal-200 bg-teal-50/70 shadow-xl shadow-teal-900/10')}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="size-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto">
          {pending ? <Clock className="size-8 text-amber-600" /> : <UserCheck className="size-8 text-teal-600" />}
        </motion.div>
        <h3 className={cn('text-xl font-black', pending ? 'text-amber-900' : 'text-teal-900')}>{pending ? 'در انتظار تأیید پرداخت' : 'رزرو قطعی شد'}</h3>
        <p className={cn('text-base', pending ? 'text-amber-800' : 'text-teal-800')}>{service?.name} · {formatTehranDateTime(b.startsAt)}</p>
        <p className="text-sm font-mono bg-white/60 rounded-full px-3 py-1 inline-block" dir="ltr">کد: {b.id?.slice(0, 8)}</p>
        {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
        <Button variant="secondary" className="mt-3" onClick={resetAll}>رزرو جدید</Button>
      </motion.div>
    );
  }

  if (step === 8 && cardState) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-white/40 bg-white/70 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-xl">
        <h3 className="font-black text-lg flex items-center gap-2"><CreditCard className="size-5" /> واریز کارت‌به‌کارت</h3>
        <div className="rounded-2xl bg-white/60 backdrop-blur border border-white/50 p-4 space-y-3 shadow-sm">
          <Row label="مبلغ" value={`${formatRial(cardState.amount)} تومان`} />
          <Row label="به نام" value={cardState.cardHolderName || '—'} />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">شماره کارت</span>
            <button type="button" className="font-mono font-bold text-sm bg-white border rounded-xl px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow" dir="ltr" onClick={() => navigator.clipboard?.writeText(String(cardState.cardNumber).replace(/\D/g, ''))}>
              {cardState.cardNumber} <span className="text-[10px] text-muted-foreground">کپی</span>
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="۴ رقم آخر کارت مبدأ *" dir="ltr" inputMode="numeric" maxLength={4} placeholder="1234" value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          <Input label="شماره پیگیری" dir="ltr" placeholder="123456789" value={cardTransferCode} onChange={(e) => setCardTransferCode(e.target.value)} />
        </div>
        <div><label className="text-sm font-medium">توضیحات تراکنش *</label><textarea value={cardTransferNote} onChange={(e) => setCardTransferNote(e.target.value)} placeholder="شماره تراکنش، تاریخ، بانک..." className="w-full rounded-2xl border border-border/50 bg-white/60 backdrop-blur p-3 text-sm min-h-[90px]" /></div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50/70 backdrop-blur px-3 py-2 text-sm text-red-700">{error}</div>}
        <Button className="w-full h-12 rounded-xl" style={{ backgroundColor: primaryColor }} loading={loading} disabled={cardLast4.length !== 4} onClick={submitCardProof}>ثبت اطلاعات واریز ✓</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* خلاصه پیشرونده - گلس مورفیسم */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.2rem] bg-white/40 backdrop-blur-2xl border border-white/30 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-sm flex items-center gap-2"><span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center"><UserCheck className="size-4 text-primary" /></span> خلاصه رزرو شما</h4>
          <span className="text-[11px] bg-white/60 rounded-full px-2.5 py-1 border border-white/40">مرحله {Math.min(step, 6)} از ۶</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {summaryItems.map((item, idx) => (
            <motion.div key={item.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.08 }} className={cn('rounded-xl p-2.5 border text-[11px] transition-all', item.done ? 'bg-white/70 shadow-sm' : 'bg-white/20 border-white/20 text-muted-foreground')} style={item.done ? { borderColor: item.color + '40', backgroundColor: 'rgba(255,255,255,0.7)' } : undefined}>
              <div className="flex items-center gap-1.5">
                <item.Icon className="size-3.5" style={{ color: item.done ? item.color : undefined }} />
                <span className="font-bold">{item.label}</span>
                {item.done && <span style={{ color: item.color }}>✓</span>}
              </div>
              <p className="mt-1 font-black truncate text-xs text-foreground">{item.value || '—'}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <motion.div key={n} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: n * 0.1 }} className={cn('flex-1 h-1.5 rounded-full origin-right', step >= n ? 'shadow-sm' : 'bg-white/40')} style={{ backgroundColor: step >= n ? stepColors[n] : undefined }} />
          ))}
        </div>
      </motion.div>

      {/* کارت اصلی مراحل - گلس */}
      <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_rgba(13,148,136,0.12)]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }} transition={{ type: 'spring', damping: 20, stiffness: 200 }} className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2">
                <span className="size-8 rounded-xl flex items-center justify-center text-white text-sm shadow-md" style={{ backgroundColor: stepColors[step] || primaryColor }}>
                  {step}
                </span>
                {step === 1 && 'انتخاب خدمت'}
                {step === 2 && 'انتخاب کارمند'}
                {step === 3 && 'انتخاب تاریخ'}
                {step === 4 && 'انتخاب ساعت'}
                {step === 5 && 'اطلاعات شما'}
                {step === 6 && 'پرداخت'}
              </h3>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                {business.services.map((s, i) => (
                  <motion.button key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} type="button" onClick={() => { setServiceId(s.id); setStep(2); }} className={cn('w-full text-right rounded-2xl border p-4 transition-all backdrop-blur-xl', serviceId === s.id ? 'border-primary bg-teal-50/70 shadow-lg shadow-teal-900/10' : 'border-white/40 bg-white/50 hover:bg-white/70 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5')}>
                    <div className="flex justify-between gap-3">
                      <div><p className="font-black text-[15px]">{s.name}</p><p className="text-xs text-muted-foreground mt-1">{s.durationMinutes} دقیقه • {s.bufferMinutes ? `بافر ${s.bufferMinutes}′` : 'بدون بافر'}</p></div>
                      <p className="text-base font-black whitespace-nowrap" style={{ color: primaryColor }}>{formatRial(s.price)} <span className="text-xs font-semibold text-muted-foreground">ت</span></p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => { setMemberId(''); setStep(3); }} className={cn('w-full text-right rounded-2xl border p-4 backdrop-blur', !memberId ? 'border-primary bg-teal-50/70 shadow-md' : 'border-white/40 bg-white/50 hover:bg-white/70')}>
                  <p className="font-black text-[15px]">بدون ترجیح</p><p className="text-xs text-muted-foreground">اولین تایم آزاد • سیستم هوشمند انتخاب می‌کند</p>
                </motion.button>
                {business.staff.map((st, i) => (
                  <motion.button key={st.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} type="button" onClick={() => { setMemberId(st.id); setStep(3); }} className={cn('w-full text-right rounded-2xl border p-4 backdrop-blur hover:shadow-md transition-all', memberId === st.id ? 'border-primary bg-teal-50/70 shadow-md' : 'border-white/40 bg-white/50 hover:bg-white/70')}>
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-teal-700 font-black">{st.name?.[0] || '?'}</div>
                      <div><p className="font-black text-[14px]">{st.name}</p>{st.jobTitle && <p className="text-xs text-muted-foreground">{st.jobTitle}</p>}</div>
                    </div>
                  </motion.button>
                ))}
                <Button variant="ghost" className="w-full rounded-xl" onClick={() => setStep(1)}>بازگشت</Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {dateOptions.map((d, i) => (
                    <motion.button key={d.value} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} type="button" onClick={() => { setDate(d.value); setStep(4); }} className={cn('rounded-2xl border p-4 text-sm font-black backdrop-blur transition-all hover:-translate-y-0.5', date === d.value ? 'border-primary bg-teal-50/70 shadow-md text-teal-900' : 'border-white/40 bg-white/50 hover:bg-white/80')}>
                      {d.label}
                    </motion.button>
                  ))}
                </div>
                <Button variant="ghost" className="w-full rounded-xl" onClick={() => setStep(2)}>بازگشت</Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {slotsLoading && <div className="flex justify-center py-10"><div className="size-8 rounded-full border-3 border-primary border-t-transparent animate-spin" /></div>}
                {!slotsLoading && slots.length === 0 && <p className="text-sm text-muted-foreground text-center py-10 rounded-2xl bg-white/40 border border-white/30">تایم آزادی نیست — تاریخ دیگر را امتحان کنید</p>}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {slots.map((s, i) => (
                    <motion.button key={s.startsAt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} type="button" onClick={() => { setSlot(s); setStep(5); }} className={cn('rounded-2xl border py-3.5 text-base font-black tabular-nums backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md', slot?.startsAt === s.startsAt ? 'border-primary bg-teal-50/70 shadow-md text-teal-900' : 'border-white/40 bg-white/50 hover:bg-white/80')} dir="ltr">
                      {s.start}
                    </motion.button>
                  ))}
                </div>
                <Button variant="ghost" className="w-full rounded-xl" onClick={() => setStep(3)}>بازگشت</Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {sessionUser ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/40 bg-gradient-to-br from-white/70 to-teal-50/50 backdrop-blur-xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 text-teal-800 bg-white/60 border border-teal-200 rounded-xl px-3 py-2 text-xs font-bold">
                      <span className="size-6 rounded-full bg-teal-600 text-white flex items-center justify-center">✓</span>
                      حساب کاربری تأیید شده — فقط نمایشی
                    </div>
                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/60 border border-white/40 p-4 backdrop-blur">
                        <p className="text-[11px] text-muted-foreground">نام و نام خانوادگی</p>
                        <p className="font-black text-[15px] mt-1">{customerName || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim() || '—'}</p>
                      </div>
                      <div className="rounded-xl bg-white/60 border border-white/40 p-4 backdrop-blur">
                        <p className="text-[11px] text-muted-foreground">شماره تماس</p>
                        <p className="font-black text-[15px] mt-1 font-mono" dir="ltr">{customerPhone || sessionUser.phone || '—'}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {guestStep === 'phone' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 rounded-2xl bg-white/50 backdrop-blur border border-white/40 p-5">
                        <p className="text-sm font-bold">برای ادامه، شماره موبایل خود را وارد کنید</p>
                        <p className="text-xs text-muted-foreground">کد تأیید پیامک می‌شود، سپس نام شما را می‌گیریم و ثبت‌نام خودکار انجام می‌شود</p>
                        <Input label="شماره موبایل" type="tel" inputMode="tel" dir="ltr" placeholder="0912..." value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
                        <Button className="w-full h-11 rounded-xl" style={{ backgroundColor: primaryColor }} loading={guestLoading} disabled={!guestPhone.trim()} onClick={handleGuestRequestOtp}>ارسال کد تأیید →</Button>
                      </motion.div>
                    )}
                    {guestStep === 'otp' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-2xl bg-white/50 backdrop-blur border border-white/40 p-5">
                        <p className="text-sm">کد ۵ رقمی ارسال شده به <span dir="ltr" className="font-mono font-black">{guestPhone}</span> را وارد کنید</p>
                        <Input label="کد تأیید" inputMode="numeric" dir="ltr" maxLength={5} placeholder="12345" value={guestOtp} onChange={(e) => setGuestOtp(e.target.value.replace(/\D/g, ''))} />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setGuestStep('phone')}>تغییر شماره</Button>
                          <Button className="flex-1 rounded-xl" style={{ backgroundColor: primaryColor }} loading={guestLoading} disabled={guestOtp.length < 4} onClick={handleGuestVerifyOtp}>تأیید</Button>
                        </div>
                      </motion.div>
                    )}
                    {guestStep === 'profile' && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 rounded-2xl bg-white/50 backdrop-blur border border-white/40 p-5">
                        <p className="text-sm font-black">تکمیل ثبت‌نام — سپس به پرداخت می‌روید</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="نام" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} required />
                          <Input label="نام خانوادگی" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} required />
                        </div>
                        <Input label="رمز عبور (برای ورود بعدی)" type="password" value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)} hint="حداقل ۶ کاراکتر" required />
                        <Button className="w-full h-11 rounded-xl" style={{ backgroundColor: primaryColor }} loading={guestLoading} onClick={handleGuestCompleteProfile}>ثبت‌نام و ادامه به پرداخت →</Button>
                      </motion.div>
                    )}
                    {guestInfo && <div className="rounded-xl bg-teal-50/70 border border-teal-200 px-3 py-2 text-xs text-teal-800 backdrop-blur">{guestInfo}</div>}
                  </div>
                )}
                <Input label="یادداشت (اختیاری)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات برای منشی..." />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setStep(4)}>بازگشت</Button>
                  <Button className="flex-1 h-11 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }} disabled={!customerName.trim() || !customerPhone.trim()} onClick={() => setStep(6)}>ادامه به پرداخت →</Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="rounded-2xl bg-white/60 backdrop-blur border border-white/40 p-5 space-y-3 shadow-sm">
                  <Row label="خدمت" value={service?.name} />
                  <Row label="کارمند" value={staffMember?.name || 'بدون ترجیح'} />
                  <Row label="تاریخ" value={date ? new Date(date).toLocaleDateString('fa-IR') : '—'} />
                  <Row label="زمان" value={slot ? slot.start : '—'} />
                  <div className="h-px bg-border/50" />
                  <Row label="نام" value={customerName} />
                  <Row label="موبایل" value={customerPhone} />
                  <Row label="مبلغ" value={`${formatRial(service?.price || 0)} تومان`} />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-black">روش پرداخت</p>
                  <motion.label whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 backdrop-blur transition-all', paymentMethod === 'sandbox' ? 'border-primary bg-teal-50/70 shadow-md' : 'border-white/40 bg-white/50')}>
                    <input type="radio" name="pay" checked={paymentMethod === 'sandbox'} onChange={() => setPaymentMethod('sandbox')} className="mt-1 accent-teal-600" />
                    <span><span className="block text-[15px] font-black">درگاه آنلاین</span><span className="block text-xs text-muted-foreground mt-1">پرداخت سریع و قطعی شدن آنی نوبت</span></span>
                  </motion.label>
                  {hasCard && (
                    <motion.label whileHover={{ scale: 1.01 }} className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 backdrop-blur', paymentMethod === 'card_to_card' ? 'border-primary bg-teal-50/70 shadow-md' : 'border-white/40 bg-white/50')}>
                      <input type="radio" name="pay" checked={paymentMethod === 'card_to_card'} onChange={() => setPaymentMethod('card_to_card')} className="mt-1 accent-teal-600" />
                      <span><span className="block text-[15px] font-black">کارت‌به‌کارت</span><span className="block text-xs text-muted-foreground mt-1">واریز به کارت + تأیید دستی صاحب کسب‌وکار</span></span>
                    </motion.label>
                  )}
                </div>

                {business.cancellationPolicy && (
                  <div className="rounded-2xl border border-white/40 bg-amber-50/50 backdrop-blur p-4 text-xs text-muted-foreground leading-6">
                    <p className="font-black text-foreground mb-1 flex items-center gap-2"><FileText className="size-4" /> قوانین لغو</p>{business.cancellationPolicy}
                  </div>
                )}

                <label className="flex items-start gap-2 text-sm cursor-pointer p-3 rounded-xl bg-white/40 border border-white/30">
                  <input type="checkbox" checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} className="mt-1 accent-teal-600 size-4" />
                  <span>قوانین رزرو و لغو را می‌پذیرم</span>
                </label>

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setStep(5)}>بازگشت</Button>
                  <Button className="flex-1 h-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: primaryColor }} loading={loading} disabled={!policyAccepted} onClick={submitBooking}>
                    {paymentMethod === 'card_to_card' ? 'ادامه واریز →' : 'پرداخت آنلاین →'}
                  </Button>
                </div>
              </motion.div>
            )}

            {error && step !== 8 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-red-200 bg-red-50/70 backdrop-blur px-4 py-3 text-sm text-red-700">
                {error}
              </motion.div>
            )}
            {guestInfo && !sessionUser && step === 5 && (
              <div className="rounded-xl bg-blue-50/60 border border-blue-200 px-3 py-2 text-xs text-blue-800">{guestInfo}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-black text-left">{value}</span>
    </div>
  );
}
