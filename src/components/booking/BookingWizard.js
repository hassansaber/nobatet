'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatRial } from '@/lib/utils';
import { formatTehranDateTime } from '@/lib/datetime';

export function BookingWizard({ business, primaryColor = '#0d9488' }) {
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
  const hasPrefilledRef = useRef({ name: false, phone: false });

  const service = useMemo(() => business.services.find((s) => s.id === serviceId), [business.services, serviceId]);
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

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) { setUserLoaded(true); return; }
      const data = await res.json();
      if (data.ok && data.user) {
        setSessionUser(data.user);
        const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim();
        if (fullName) {
          setCustomerName((prev) => {
            if (!prev || prev.trim() === '' || !hasPrefilledRef.current.name) {
              hasPrefilledRef.current.name = true;
              return fullName;
            }
            return prev;
          });
        }
        if (data.user.phone) {
          setCustomerPhone((prev) => {
            if (!prev || prev.trim() === '' || !hasPrefilledRef.current.phone) {
              hasPrefilledRef.current.phone = true;
              return data.user.phone;
            }
            return prev;
          });
        }
      }
    } catch {} finally { setUserLoaded(true); }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (step === 5 && sessionUser) {
      const fullName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim();
      if (fullName && (!customerName || customerName.trim() === '')) setCustomerName(fullName);
      if (sessionUser.phone && (!customerPhone || customerPhone.trim() === '')) setCustomerPhone(sessionUser.phone);
    }
    if (step === 5 && !userLoaded) fetchUser();
  }, [step, sessionUser, userLoaded, customerName, customerPhone, fetchUser]);

  useEffect(() => {
    if (!sessionUser) return;
    const fullName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim();
    if (fullName && !customerName) setCustomerName(fullName);
    if (sessionUser.phone && !customerPhone) setCustomerPhone(sessionUser.phone);
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

  function resetAll() {
    setResult(null); setCardState(null); setStep(1); setServiceId(''); setMemberId(''); setDate(''); setSlot(null); setPolicyAccepted(false); setPaymentMethod('sandbox'); setCardLast4(''); setCardTransferCode(''); setCardTransferNote('');
    hasPrefilledRef.current = { name: false, phone: false };
    if (sessionUser) {
      const fullName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim();
      if (fullName) { setCustomerName(fullName); hasPrefilledRef.current.name = true; }
      if (sessionUser.phone) { setCustomerPhone(sessionUser.phone); hasPrefilledRef.current.phone = true; }
    }
  }

  if (result && step === 7) {
    const b = result.booking;
    const pending = b.status === 'pending_payment' || result.cardSubmitted;
    return (
      <div className={cn('rounded-2xl border p-6 text-center space-y-3', pending ? 'border-amber-100 bg-amber-50' : 'border-teal-100 bg-teal-50')}>
        <div className="text-4xl">{pending ? '⏳' : '✅'}</div>
        <h3 className={cn('text-lg font-black', pending ? 'text-amber-900' : 'text-teal-900')}>{pending ? 'در انتظار تأیید پرداخت' : 'رزرو قطعی شد'}</h3>
        <p className={cn('text-base', pending ? 'text-amber-800' : 'text-teal-800')}>{service?.name} · {formatTehranDateTime(b.startsAt)}</p>
        <p className="text-sm" dir="ltr">کد: {b.id?.slice(0, 8)}</p>
        {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
        <Button variant="secondary" className="mt-2" onClick={resetAll}>رزرو جدید</Button>
      </div>
    );
  }

  if (step === 8 && cardState) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">💳 واریز کارت‌به‌کارت</h3>
        <div className="rounded-xl bg-slate-50 border border-border p-4 text-base space-y-2">
          <Row label="مبلغ" value={`${formatRial(cardState.amount)} تومان`} />
          <Row label="به نام" value={cardState.cardHolderName || '—'} />
          <div className="flex justify-between gap-3 items-center">
            <span className="text-muted-foreground text-sm">شماره کارت</span>
            <button type="button" className="font-mono font-bold tracking-wider text-left text-sm bg-white border rounded-lg px-2 py-1" dir="ltr" onClick={() => { navigator.clipboard?.writeText(String(cardState.cardNumber).replace(/\D/g, '')); }}>
              {cardState.cardNumber} <span className="text-[10px] text-muted-foreground">کپی</span>
            </button>
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs leading-6 text-amber-800">💡 مبلغ را کارت‌به‌کارت کنید، سپس فرم زیر را کامل پر کنید.</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="۴ رقم آخر کارت مبدأ *" dir="ltr" inputMode="numeric" maxLength={4} placeholder="مثلا 1234" value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          <Input label="شماره پیگیری / ارجاع" dir="ltr" placeholder="مثلا 123456789" value={cardTransferCode} onChange={(e) => setCardTransferCode(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">توضیحات تراکنش *</label>
          <textarea value={cardTransferNote} onChange={(e) => setCardTransferNote(e.target.value)} placeholder="مثلا: شماره تراکنش 458392 - تاریخ 1403/05/20 ساعت 14:30 - بانک ملت" className="w-full rounded-xl border border-border p-3 text-sm min-h-[90px]" />
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Button className="w-full" style={{ backgroundColor: primaryColor }} loading={loading} disabled={cardLast4.length !== 4} onClick={submitCardProof}>ثبت اطلاعات واریز ✓</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="flex border-b border-border">
        {[1, 2, 3, 4, 5, 6].map((n) => (<div key={n} className={cn('flex-1 h-1.5', step >= n ? 'bg-primary' : 'bg-muted')} style={step >= n ? { backgroundColor: primaryColor } : undefined} />))}
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{step === 1 && 'انتخاب خدمت'}{step === 2 && 'انتخاب کارمند'}{step === 3 && 'انتخاب تاریخ'}{step === 4 && 'انتخاب ساعت'}{step === 5 && 'اطلاعات شما'}{step === 6 && 'پرداخت'}</h3>
          <span className="text-sm text-muted-foreground">مرحله {Math.min(step, 6)} از ۶</span>
        </div>

        {sessionUser && step === 5 && (
          <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 px-3 py-2.5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black">✓</span>
              <span className="text-teal-900 font-medium">👋 {sessionUser.firstName ? `${sessionUser.firstName} عزیز،` : ''} اطلاعات شما خودکار پر شد</span>
            </div>
            <button onClick={fetchUser} className="text-[11px] text-primary hover:underline">🔄</button>
          </div>
        )}

        {step === 1 && (<div className="space-y-2">{business.services.map((s) => (<button key={s.id} type="button" onClick={() => { setServiceId(s.id); setStep(2); }} className={cn('w-full text-right rounded-xl border p-4 transition-all', serviceId === s.id ? 'border-primary bg-teal-50 shadow-sm' : 'border-border hover:border-primary/40 hover:shadow-sm')}><div className="flex justify-between gap-3"><div><p className="font-bold text-base">{s.name}</p><p className="text-sm text-muted-foreground mt-0.5">{s.durationMinutes} دقیقه</p></div><p className="text-base font-black whitespace-nowrap text-primary">{formatRial(s.price)} <span className="text-sm font-semibold text-muted-foreground">ت</span></p></div></button>))}</div>)}
        {step === 2 && (<div className="space-y-2"><button type="button" onClick={() => { setMemberId(''); setStep(3); }} className={cn('w-full text-right rounded-xl border p-4', !memberId ? 'border-primary bg-teal-50' : 'border-border hover:border-primary/40')}><p className="font-bold text-base">بدون ترجیح</p><p className="text-sm text-muted-foreground">اولین تایم آزاد</p></button>{business.staff.map((st) => (<button key={st.id} type="button" onClick={() => { setMemberId(st.id); setStep(3); }} className={cn('w-full text-right rounded-xl border p-4 hover:border-primary/40', memberId === st.id ? 'border-primary bg-teal-50' : 'border-border')}><p className="font-bold text-base">{st.name}</p>{st.jobTitle && <p className="text-sm text-muted-foreground">{st.jobTitle}</p>}</button>))}<Button variant="ghost" className="w-full" onClick={() => setStep(1)}>بازگشت</Button></div>)}
        {step === 3 && (<div className="space-y-3"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{dateOptions.map((d) => (<button key={d.value} type="button" onClick={() => { setDate(d.value); setStep(4); }} className={cn('rounded-xl border p-3.5 text-sm font-bold', date === d.value ? 'border-primary bg-teal-50 text-teal-900' : 'border-border hover:border-primary/40')}>{d.label}</button>))}</div><Button variant="ghost" className="w-full" onClick={() => setStep(2)}>بازگشت</Button></div>)}
        {step === 4 && (<div className="space-y-3">{slotsLoading && <p className="text-base text-muted-foreground text-center py-6">در حال محاسبه...</p>}{!slotsLoading && slots.length === 0 && <p className="text-base text-muted-foreground text-center py-6">تایم آزادی نیست.</p>}<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{slots.map((s) => (<button key={s.startsAt} type="button" onClick={() => { setSlot(s); setStep(5); }} className={cn('rounded-xl border py-3 text-base font-bold tabular-nums hover:border-primary/40 hover:bg-teal-50', slot?.startsAt === s.startsAt && 'border-primary bg-teal-50 text-teal-900')} dir="ltr">{s.start}</button>))}</div><Button variant="ghost" className="w-full" onClick={() => setStep(3)}>بازگشت</Button></div>)}

        {step === 5 && (
          <div className="space-y-3">
            <Input label="نام و نام خانوادگی" value={customerName} onChange={(e) => { setCustomerName(e.target.value); hasPrefilledRef.current.name = true; }} placeholder={sessionUser ? `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim() + ' (از حساب شما)' : 'مثلا علی رضایی'} required />
            <Input label="شماره موبایل" type="tel" inputMode="tel" dir="ltr" placeholder="09123456789" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); hasPrefilledRef.current.phone = true; }} required />
            {sessionUser && <p className="text-[11px] text-muted-foreground -mt-1">💡 {sessionUser.phone} از حساب شما — قابل ویرایش</p>}
            {!userLoaded && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">⏳ بارگذاری اطلاعات حساب...</p>}
            <Input label="یادداشت (اختیاری)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات..." />
            <div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setStep(4)}>بازگشت</Button><Button className="flex-1" style={{ backgroundColor: primaryColor }} disabled={!customerName.trim() || !customerPhone.trim()} onClick={() => setStep(6)}>ادامه</Button></div>
          </div>
        )}

        {step === 6 && (<div className="space-y-4"><div className="rounded-xl bg-muted p-4 text-base space-y-2"><Row label="خدمت" value={service?.name} /><Row label="زمان" value={slot ? formatTehranDateTime(slot.startsAt) : '—'} /><Row label="نام" value={customerName} /><Row label="مبلغ" value={`${formatRial(service?.price || 0)} تومان`} /></div><div className="space-y-2"><p className="text-base font-bold">روش پرداخت</p><label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3.5', paymentMethod === 'sandbox' ? 'border-primary bg-teal-50' : 'border-border')}><input type="radio" name="pay" checked={paymentMethod === 'sandbox'} onChange={() => setPaymentMethod('sandbox')} className="mt-1 accent-teal-600" /><span><span className="block text-base font-bold">درگاه آنلاین</span><span className="block text-sm text-muted-foreground">پرداخت سریع</span></span></label>{hasCard && (<label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3.5', paymentMethod === 'card_to_card' ? 'border-primary bg-teal-50' : 'border-border')}><input type="radio" name="pay" checked={paymentMethod === 'card_to_card'} onChange={() => setPaymentMethod('card_to_card')} className="mt-1 accent-teal-600" /><span><span className="block text-base font-bold">کارت‌به‌کارت</span><span className="block text-sm text-muted-foreground">واریز + تأیید دستی</span></span></label>)}</div>{business.cancellationPolicy && (<div className="rounded-xl border border-border p-3 text-sm text-muted-foreground leading-7"><p className="font-bold text-foreground mb-1">قوانین لغو</p>{business.cancellationPolicy}</div>)}<label className="flex items-start gap-2 text-base cursor-pointer"><input type="checkbox" checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} className="mt-1 accent-teal-600" /><span>قوانین را می‌پذیرم</span></label><div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setStep(5)}>بازگشت</Button><Button className="flex-1" style={{ backgroundColor: primaryColor }} loading={loading} disabled={!policyAccepted} onClick={submitBooking}>{paymentMethod === 'card_to_card' ? 'ادامه واریز' : 'پرداخت آنلاین'}</Button></div></div>)}

        {error && step !== 8 && (<div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>)}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (<div className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-bold text-left">{value}</span></div>);
}
