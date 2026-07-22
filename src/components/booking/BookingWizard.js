'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, User, Calendar, Clock, UserCheck, CreditCard, FileText, Check, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatRial } from '@/lib/utils';
import { formatTehranDateTime } from '@/lib/datetime';

const DRAFT_KEY = (bizId) => `nobatet_booking_draft_${bizId}`;

export function BookingWizard({ business, primaryColor = '#0284C7' }) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 3 مرحله جدید
  const [serviceIds, setServiceIds] = useState([]);
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
  const [nextAvailable, setNextAvailable] = useState(null);
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const selectedServices = useMemo(() => business.services.filter((s) => serviceIds.includes(s.id)), [business.services, serviceIds]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + (s.price || 0), 0), [selectedServices]);
  const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0), [selectedServices]);
  const totalBuffer = useMemo(() => selectedServices.reduce((sum, s) => sum + (s.bufferMinutes || 0), 0), [selectedServices]);
  const hasCard = Boolean(business.cardNumber);

  const staffMember = useMemo(() => business.staff.find((s) => s.id === memberId), [business.staff, memberId]);

  // تاریخ‌های ۱۴ روز آینده با اطلاعات شمسی + تعطیلات
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
      const fa = d.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'short', month: 'short', day: 'numeric' });
      const isToday = i === 0;
      const isFriday = d.getDay() === 5; // جمعه
      opts.push({ value, label: fa, isToday, isFriday, isWeekend: isFriday });
    }
    const seen = new Set();
    return opts.filter((o) => { if (seen.has(o.value)) return false; seen.add(o.value); return true; });
  }, []);

  // لود user + draft
  useEffect(() => {
    // draft
    try {
      const raw = localStorage.getItem(DRAFT_KEY(business.id));
      if (raw) {
        const d = JSON.parse(raw);
        if (d.serviceIds) setServiceIds(d.serviceIds);
        if (d.memberId) setMemberId(d.memberId);
        if (d.date) setDate(d.date);
        if (d.customerName) setCustomerName(d.customerName);
        if (d.customerPhone) setCustomerPhone(d.customerPhone);
        if (d.notes) setNotes(d.notes);
      }
    } catch {}

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            setSessionUser(data.user);
            const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
            if (fullName) setCustomerName((prev) => prev || fullName);
            if (data.user.phone) setCustomerPhone((prev) => prev || data.user.phone);
          }
        }
      } catch {}
    })();
  }, [business.id]);

  // ذخیره draft
  useEffect(() => {
    try {
      const draft = { serviceIds, memberId, date, customerName, customerPhone, notes, savedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY(business.id), JSON.stringify(draft));
    } catch {}
  }, [serviceIds, memberId, date, customerName, customerPhone, notes, business.id]);

  const loadSlots = useCallback(async (targetDate = date) => {
    if (serviceIds.length === 0 || !targetDate) return;
    setSlotsLoading(true); setError(''); setSlot(null); setNextAvailable(null);
    try {
      const params = new URLSearchParams({ businessId: business.id, date: targetDate, serviceIds: serviceIds.join(',') });
      if (memberId) params.set('memberId', memberId);
      const res = await fetch(`/api/public/slots?${params}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در دریافت تایم‌ها'); setSlots([]); return; }
      const list = data.slots || [];
      setSlots(list);
      if (list.length === 0) {
        // پیشنهاد بعدی: فردا را چک کن (fallback suggestion)
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextStr = nextDay.toISOString().slice(0, 10);
        try {
          const p2 = new URLSearchParams({ businessId: business.id, date: nextStr, serviceIds: serviceIds.join(',') });
          if (memberId) p2.set('memberId', memberId);
          const r2 = await fetch(`/api/public/slots?${p2}`);
          const d2 = await r2.json();
          if (d2.ok && d2.slots?.length) {
            setNextAvailable({ date: nextStr, count: d2.slots.length, sample: d2.slots[0] });
          }
        } catch {}
      }
    } catch { setError('ارتباط با سرور برقرار نشد'); setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [business.id, serviceIds, date, memberId]);

  useEffect(() => { if (date) loadSlots(date); }, [loadSlots, date]);

  function toggleService(id) {
    setServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  // اعتبارسنجی inline
  const phoneValid = /09\d{9}$/.test(customerPhone.replace(/\D/g, '').slice(-11));
  const nameValid = customerName.trim().length >= 2;

  async function submitBooking() {
    if (!phoneValid) { setError('شماره موبایل معتبر نیست - 11 رقم با 09'); return; }
    if (!nameValid) { setError('نام حداقل ۲ کاراکتر'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, serviceIds, serviceId: serviceIds[0], memberId: memberId || slot?.memberId || null, startsAt: slot.startsAt, customerName, customerPhone, policyAccepted, notes: notes || null, paymentMethod }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت رزرو ناموفق'); return; }
      if (data.needsGateway && data.redirectUrl) { router.push(data.redirectUrl); return; }
      if (data.needsCardTransfer) { setCardState(data); setStep(4); return; }
      // پاک کردن draft بعد از موفقیت
      try { localStorage.removeItem(DRAFT_KEY(business.id)); } catch {}
      setResult(data); setStep(5);
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  async function submitCardProof() {
    if (!cardState?.booking?.id) return;
    if (cardLast4.length !== 4) { setError('۴ رقم آخر الزامی'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/public/payments/card-to-card', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cardState.booking.id, sourceCardLast4: cardLast4, transferCode: cardTransferCode, transferNote: cardTransferNote }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت رسید ناموفق'); return; }
      setResult({ ...cardState, booking: { ...cardState.booking, status: 'pending_payment' }, cardSubmitted: true, message: data.message });
      setStep(5);
    } catch { setError('ارتباط با سرور برقرار نشد'); } finally { setLoading(false); }
  }

  function resetAll() {
    setResult(null); setCardState(null); setStep(1); setServiceIds([]); setMemberId(''); setDate(''); setSlot(null); setPolicyAccepted(false); setPaymentMethod('sandbox'); setCardLast4(''); setCardTransferCode(''); setCardTransferNote('');
    try { localStorage.removeItem(DRAFT_KEY(business.id)); } catch {}
  }

  // نتیجه نهایی
  if (result && step === 5) {
    const b = result.booking;
    const pending = b.status === 'pending_payment' || result.cardSubmitted;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn('rounded-[1.5rem] border p-6 text-center space-y-3 backdrop-blur-xl', pending ? 'border-amber-200 bg-amber-50/70' : 'border-teal-200 bg-teal-50/70 shadow-xl')}>
        <div className="size-14 rounded-full bg-white shadow-md flex items-center justify-center mx-auto">
          {pending ? <Clock className="size-7 text-amber-600" /> : <UserCheck className="size-7 text-teal-600" />}
        </div>
        <h3 className={cn('font-lalezar text-[18px]', pending ? 'text-amber-900' : 'text-teal-900')}>{pending ? 'در انتظار تأیید پرداخت' : 'رزرو قطعی شد ✓'}</h3>
        <p className="text-[13px]">{selectedServices.map(s=>s.name).join(' + ')} • {totalDuration} دقیقه</p>
        <p className="text-[12px] text-muted-foreground">{formatTehranDateTime(b.startsAt)}</p>
        <p className="text-[11px] font-mono bg-white/60 rounded-full px-3 py-1 inline-block">کد: {b.id?.slice(0, 8)}</p>
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="secondary" size="sm" onClick={resetAll}>رزرو جدید</Button>
          <Button size="sm" onClick={()=>router.push('/me')}>داشبورد من</Button>
        </div>
      </motion.div>
    );
  }

  if (step === 4 && cardState) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] border border-white/40 bg-white/70 backdrop-blur-xl p-5 space-y-5 shadow-xl">
        <h3 className="font-lalezar text-[15px] flex items-center gap-2"><CreditCard className="size-5" /> واریز کارت‌به‌کارت</h3>
        <div className="rounded-2xl bg-white/60 border p-4 space-y-2 text-[12px]">
          <Row label="مبلغ" value={`${formatRial(cardState.amount)} تومان`} />
          <Row label="خدمات" value={selectedServices.map(s=>s.name).join(' + ')} />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">شماره کارت</span>
            <button onClick={() => navigator.clipboard?.writeText(String(cardState.cardNumber).replace(/\D/g, ''))} className="font-mono bg-white border rounded-xl px-3 py-1.5 shadow-sm" dir="ltr">{cardState.cardNumber} کپی</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="۴ رقم آخر *" dir="ltr" inputMode="numeric" maxLength={4} placeholder="1234" value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          <Input label="شماره پیگیری" placeholder="123456" value={cardTransferCode} onChange={(e) => setCardTransferCode(e.target.value)} />
        </div>
        <div><label className="text-[12px]">توضیحات *</label><textarea value={cardTransferNote} onChange={(e) => setCardTransferNote(e.target.value)} className="w-full rounded-2xl border p-3 text-[13px] min-h-[70px]" placeholder="تاریخ و بانک..." /></div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}
        <Button className="w-full h-11 rounded-xl" style={{ backgroundColor: primaryColor }} loading={loading} disabled={cardLast4.length!==4} onClick={submitCardProof}>ثبت واریز</Button>
      </motion.div>
    );
  }

  // خلاصه sticky
  const progress = (step / 3) * 100;

  return (
    <div className="space-y-4">
      {/* Progress + Summary sticky */}
      <div className="sticky top-[60px] z-20 rounded-[1.2rem] glass-strong p-3 shadow-lg border border-white/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-lalezar text-[13px] flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /> رزرو هوشمند - {step} از ۳</h4>
          <span className="text-[10px] glass-card px-2 py-1 rounded-full">{totalDuration ? `${totalDuration}′` : ''} {totalPrice ? `${formatRial(totalPrice)} ت` : ''}</span>
        </div>
        <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ backgroundColor: primaryColor }} />
        </div>
        {serviceIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedServices.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full">
                <Scissors className="size-3" />{s.name}
              </span>
            ))}
            {memberId && <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-full flex items-center gap-1"><User className="size-3" />{staffMember?.name || 'متخصص'}</span>}
            {date && <span className="text-[10px] glass-card px-2 py-1 rounded-full"><Calendar className="size-3 inline" /> {new Date(date).toLocaleDateString('fa-IR')}</span>}
            {slot && <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full"><Clock className="size-3 inline" /> {slot.start}</span>}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] glass-strong overflow-hidden shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ type: 'spring', damping: 22, stiffness: 250 }} className="p-4 sm:p-5 space-y-4">

            {/* مرحله ۱: خدمت + کارمند */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-lalezar text-[15px] flex items-center gap-2"><span className="size-7 rounded-xl bg-primary text-white flex items-center justify-center text-[12px]">۱</span> خدمت و متخصص را انتخاب کن</h3>

                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Scissors className="size-3" /> خدمات قابل انتخاب (چندتایی)</p>
                  {business.services.map((s) => {
                    const sel = serviceIds.includes(s.id);
                    const popular = s.price > 500000; // مثال: گران‌ها محبوب؟
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={cn('w-full text-right rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all', sel ? 'border-primary bg-teal-50/70 shadow-md' : 'glass-card hover:bg-white/70')}>
                        <div className="flex items-center gap-3">
                          <div className={cn('size-6 rounded-lg border-2 flex items-center justify-center', sel ? 'bg-primary border-primary text-white' : 'border-border bg-white')}>{sel && <Check className="size-3.5" />}</div>
                          <div className="text-right"><p className="font-medium text-[13px] flex items-center gap-1.5">{s.name} {popular && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">محبوب</span>}</p><p className="text-[11px] text-muted-foreground">{s.durationMinutes}′ • {formatRial(s.price)} ت</p></div>
                        </div>
                        <span className="text-[12px] font-medium" style={{ color: primaryColor }}>{formatRial(s.price)} ت</span>
                      </button>
                    );
                  })}
                </div>

                {serviceIds.length > 0 && (
                  <>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-2"><User className="size-3" /> متخصص (اختیاری)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button type="button" onClick={() => setMemberId('')} className={cn('rounded-xl border p-3 text-right glass-card', !memberId ? 'border-primary bg-teal-50/70' : '')}><p className="font-medium text-[12px]">بدون ترجیح - بهترین متخصص</p><p className="text-[11px] text-muted-foreground">سیستم خودکار انتخاب می‌کند</p></button>
                      {business.staff.map((st) => (
                        <button key={st.id} type="button" onClick={() => setMemberId(st.id)} className={cn('rounded-xl border p-3 text-right glass-card flex items-center gap-2', memberId === st.id ? 'border-primary bg-teal-50/70' : '')}>
                          <div className="size-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-[11px]">{st.name?.[0]}</div>
                          <div><p className="font-medium text-[12px]">{st.name}</p><p className="text-[10px] text-muted-foreground">{st.jobTitle || 'متخصص'}</p></div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <Button className="w-full h-11 rounded-xl shadow-md" style={{ backgroundColor: primaryColor }} disabled={serviceIds.length === 0} onClick={() => setStep(2)}>ادامه به انتخاب زمان →</Button>
              </div>
            )}

            {/* مرحله ۲: تاریخ + ساعت */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-lalezar text-[15px] flex items-center gap-2"><span className="size-7 rounded-xl bg-primary text-white flex items-center justify-center text-[12px]">۲</span> تاریخ و ساعت</h3>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1"><Calendar className="size-3" /> تاریخ (۱۴ روز آینده)</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dateOptions.map((d) => (
                      <button key={d.value} type="button" onClick={() => { setDate(d.value); }} className={cn('rounded-xl border p-2.5 text-[11px] font-medium glass-card transition-all', date === d.value ? 'border-primary bg-teal-50/70 shadow-md' : '', d.isWeekend ? 'bg-red-50/50 border-red-100' : '')}>
                        <span className={cn(d.isToday ? 'text-primary font-bold' : '')}>{d.label}</span>
                        {d.isFriday && <span className="block text-[9px] text-red-500 mt-1">تعطیل؟</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {date && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1"><Clock className="size-3" /> ساعت‌های آزاد {date && `برای ${new Date(date).toLocaleDateString('fa-IR')}`}</p>
                    {slotsLoading && <div className="flex justify-center py-6"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                    {!slotsLoading && slots.length === 0 && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-800">
                          <p className="flex items-center gap-1"><AlertCircle className="size-4" /> تایمی در این تاریخ آزاد نیست.</p>
                          {nextAvailable && <p className="mt-2">نزدیک‌ترین: <button onClick={() => { setDate(nextAvailable.date); }} className="font-bold text-primary underline">{new Date(nextAvailable.date).toLocaleDateString('fa-IR')} ساعت {nextAvailable.sample?.start}</button> - {nextAvailable.count} تایم آزاد</p>}
                          {!nextAvailable && <p className="mt-1 text-[11px]">تاریخ دیگری را امتحان کنید یا در لیست انتظار بگذارید.</p>}
                        </div>
                        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2">
                          <p className="text-[11px] font-medium">در لیست انتظار بگذار - به محض آزاد شدن تماس می‌گیریم</p>
                          <div className="flex gap-2">
                            <input value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)} placeholder="0912..." dir="ltr" className="flex-1 rounded-xl border p-2.5 text-[13px] font-mono" />
                            <Button size="sm" className="h-10" loading={waitlistLoading} onClick={async () => {
                              if (!waitlistPhone) return;
                              setWaitlistLoading(true);
                              try {
                                const res = await fetch('/api/public/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: business.id, customerPhone: waitlistPhone, customerName, desiredDate: date, serviceId: serviceIds[0] }) });
                                const data = await res.json();
                                if (data.ok) setWaitlistSuccess(true);
                              } catch {} finally { setWaitlistLoading(false); }
                            }}>ثبت در انتظار</Button>
                          </div>
                          {waitlistSuccess && <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 p-2 rounded-xl">در لیست انتظار ثبت شدی ✓</p>}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((s) => {
                        const isPopular = ['10:00', '11:00', '16:00', '17:00'].includes(s.start);
                        return (
                          <button key={s.startsAt} type="button" onClick={() => setSlot(s)} className={cn('relative rounded-xl border py-3 text-[13px] font-medium glass-card tabular-nums', slot?.startsAt === s.startsAt ? 'border-primary bg-teal-50/70 shadow-md text-teal-900' : '')} dir="ltr">
                            {s.start}
                            {isPopular && <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded-full">محبوب</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 h-10 rounded-xl" onClick={() => setStep(1)}>بازگشت</Button>
                  <Button className="flex-1 h-10 rounded-xl" style={{ backgroundColor: primaryColor }} disabled={!date || !slot} onClick={() => setStep(3)}>ادامه به اطلاعات →</Button>
                </div>
              </div>
            )}

            {/* مرحله ۳: اطلاعات + پرداخت */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-lalezar text-[15px] flex items-center gap-2"><span className="size-7 rounded-xl bg-primary text-white flex items-center justify-center text-[12px]">۳</span> اطلاعات و پرداخت</h3>

                {/* خلاصه نهایی sticky */}
                <div className="rounded-xl glass p-3 space-y-1.5 text-[12px] shadow-sm">
                  {selectedServices.map(s => <Row key={s.id} label={s.name} value={`${s.durationMinutes}′ • ${formatRial(s.price)} ت`} />)}
                  <div className="h-px bg-border/50" />
                  <Row label="متخصص" value={staffMember?.name || 'بدون ترجیح - هوشمند'} />
                  <Row label="تاریخ" value={date ? new Date(date).toLocaleDateString('fa-IR') : '—'} />
                  <Row label="ساعت" value={slot?.start || '—'} />
                  <Row label="جمع" value={`${totalDuration} دقیقه • ${formatRial(totalPrice)} تومان`} strong />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium">نام و نام خانوادگی *</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="مریم احمدی" className={cn('w-full mt-1 rounded-xl border p-2.5 text-[13px] bg-white/70', !nameValid && customerName ? 'border-red-300' : 'border-border')} />
                    {!nameValid && customerName && <p className="text-[10px] text-red-500 mt-1">حداقل ۲ کاراکتر</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium">موبایل *</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="0912..." className={cn('w-full mt-1 rounded-xl border p-2.5 text-[13px] bg-white/70 font-mono', !phoneValid && customerPhone ? 'border-red-300' : 'border-border')} />
                    {!phoneValid && customerPhone && <p className="text-[10px] text-red-500 mt-1">09xxxxxxxxx</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium">یادداشت (اختیاری)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیح برای منشی..." className="w-full mt-1 rounded-xl border border-border p-2.5 text-[13px] min-h-[60px] bg-white/70" />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-medium flex items-center gap-1"><CreditCard className="size-3" /> روش پرداخت</p>
                  <label className={cn('flex items-start gap-2 rounded-xl border p-3 cursor-pointer glass-card', paymentMethod === 'sandbox' ? 'border-primary bg-teal-50/60' : '')}>
                    <input type="radio" checked={paymentMethod === 'sandbox'} onChange={() => setPaymentMethod('sandbox')} className="mt-0.5 accent-teal-600" />
                    <span className="text-[12px]"><span className="font-medium">درگاه آنلاین (پیشنهادی)</span><br/><span className="text-[11px] text-muted-foreground">پرداخت سریع و قطعی آنی + badge امن</span></span>
                  </label>
                  {hasCard && (
                    <label className={cn('flex items-start gap-2 rounded-xl border p-3 cursor-pointer glass-card', paymentMethod === 'card_to_card' ? 'border-primary bg-teal-50/60' : '')}>
                      <input type="radio" checked={paymentMethod === 'card_to_card'} onChange={() => setPaymentMethod('card_to_card')} className="mt-0.5 accent-teal-600" />
                      <span className="text-[12px]"><span className="font-medium">کارت‌به‌کارت</span><br/><span className="text-[11px] text-muted-foreground">واریز + تأیید دستی صاحب بیزنس</span></span>
                    </label>
                  )}
                </div>

                {business.cancellationPolicy && (
                  <div className="rounded-xl glass p-3 text-[11px] text-muted-foreground leading-6">
                    <p className="font-medium text-foreground flex items-center gap-1"><FileText className="size-3.5" /> قوانین</p>
                    {business.cancellationPolicy}
                  </div>
                )}

                <label className="flex items-start gap-2 text-[12px] p-2.5 rounded-xl glass-card cursor-pointer">
                  <input type="checkbox" checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} className="mt-0.5 accent-teal-600 size-4" />
                  <span>قوانین را می‌پذیرم <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full ml-1"><ShieldCheck className="size-3" /> پرداخت امن</span></span>
                </label>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

                <div className="flex gap-2 sticky bottom-2 bg-white/80 backdrop-blur-xl p-2 rounded-xl border border-white/50 shadow-lg">
                  <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setStep(2)}>بازگشت</Button>
                  <Button className="flex-[2] h-11 rounded-xl shadow-md" style={{ backgroundColor: primaryColor }} loading={loading} disabled={!policyAccepted || !nameValid || !phoneValid} onClick={submitBooking}>
                    {paymentMethod === 'card_to_card' ? 'ثبت و ادامه واریز' : `پرداخت ${formatRial(totalPrice)} ت`}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">با ادامه، اطلاعات شما با SSL محافظت می‌شود • لغو ۲۴h رایگان</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn('flex justify-between gap-3 text-[12px]', strong && 'font-bold')}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-left">{value}</span>
    </div>
  );
}
