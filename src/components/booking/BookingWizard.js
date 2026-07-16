'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatRial } from '@/lib/utils';
import { formatTehranDateTime } from '@/lib/datetime';

/**
 * فلوی رزرو عمومی
 * خدمت → کارمند → تاریخ → تایم → اطلاعات → روش پرداخت
 */
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
  const [result, setResult] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);

  const service = useMemo(
    () => business.services.find((s) => s.id === serviceId),
    [business.services, serviceId],
  );

  const hasCard = Boolean(business.cardNumber);

  // prefills for logged-in user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.ok || !data.user) return;
        setSessionUser(data.user);
        const fullName = [data.user.firstName, data.user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (fullName) setCustomerName((v) => v || fullName);
        if (data.user.phone) setCustomerPhone((v) => v || data.user.phone);
      } catch {
        /* guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dateOptions = useMemo(() => {
    const opts = [];
    // ساخت تاریخ‌های ۱۴ روز آینده بر اساس تهران
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      // YYYY-MM-DD in Tehran
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      const value = `${y}-${m}-${day}`;
      opts.push({
        value,
        label: d.toLocaleDateString('fa-IR', {
          timeZone: 'Asia/Tehran',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      });
    }
    // unique by value (timezone edge)
    const seen = new Set();
    return opts.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  }, []);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setSlotsLoading(true);
    setError('');
    setSlot(null);
    try {
      const params = new URLSearchParams({
        businessId: business.id,
        serviceId,
        date,
      });
      if (memberId) params.set('memberId', memberId);
      const res = await fetch(`/api/public/slots?${params}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا در دریافت تایم‌ها');
        setSlots([]);
        return;
      }
      setSlots(data.slots || []);
    } catch {
      setError('ارتباط با سرور برقرار نشد');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [business.id, serviceId, date, memberId]);

  useEffect(() => {
    if (step === 4) loadSlots();
  }, [step, loadSlots]);

  async function submitBooking() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId,
          memberId: memberId || slot?.memberId || null,
          startsAt: slot.startsAt,
          customerName,
          customerPhone,
          policyAccepted,
          notes: notes || null,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ثبت رزرو ناموفق بود');
        return;
      }

      if (data.needsGateway && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }

      if (data.needsCardTransfer) {
        setCardState(data);
        setStep(8);
        return;
      }

      setResult(data);
      setStep(7);
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  async function submitCardProof() {
    if (!cardState?.booking?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/payments/card-to-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: cardState.booking.id,
          sourceCardLast4: cardLast4,
          transferReportedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'ثبت رسید ناموفق');
        return;
      }
      setResult({
        ...cardState,
        booking: { ...cardState.booking, status: 'pending_payment' },
        cardSubmitted: true,
        message: data.message,
      });
      setStep(7);
    } catch {
      setError('ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setResult(null);
    setCardState(null);
    setStep(1);
    setServiceId('');
    setMemberId('');
    setDate('');
    setSlot(null);
    setPolicyAccepted(false);
    setPaymentMethod('sandbox');
    setCardLast4('');
    // keep prefilled identity
    if (sessionUser) {
      const fullName = [sessionUser.firstName, sessionUser.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (fullName) setCustomerName(fullName);
      if (sessionUser.phone) setCustomerPhone(sessionUser.phone);
    }
  }

  if (result && step === 7) {
    const b = result.booking;
    const pending = b.status === 'pending_payment' || result.cardSubmitted;
    return (
      <div
        className={cn(
          'rounded-2xl border p-6 text-center space-y-3',
          pending
            ? 'border-amber-100 bg-amber-50'
            : 'border-teal-100 bg-teal-50',
        )}
      >
        <div className="text-4xl">{pending ? '⏳' : '✅'}</div>
        <h3
          className={cn(
            'text-lg font-black',
            pending ? 'text-amber-900' : 'text-teal-900',
          )}
        >
          {pending ? 'در انتظار تأیید پرداخت' : 'رزرو قطعی شد'}
        </h3>
        <p className={cn('text-base', pending ? 'text-amber-800' : 'text-teal-800')}>
          {service?.name} · {formatTehranDateTime(b.startsAt)}
        </p>
        <p className="text-sm" dir="ltr">
          کد: {b.id?.slice(0, 8)}
        </p>
        {result.message && (
          <p className="text-sm text-muted-foreground">{result.message}</p>
        )}
        <Button variant="secondary" className="mt-2" onClick={resetAll}>
          رزرو جدید
        </Button>
      </div>
    );
  }

  if (step === 8 && cardState) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 space-y-4">
        <h3 className="font-bold text-lg">واریز کارت‌به‌کارت</h3>
        <div className="rounded-xl bg-muted p-4 text-base space-y-2">
          <Row label="مبلغ" value={`${formatRial(cardState.amount)} تومان`} />
          <Row label="به نام" value={cardState.cardHolderName || '—'} />
          <div className="flex justify-between gap-3 items-center">
            <span className="text-muted-foreground">شماره کارت</span>
            <button
              type="button"
              className="font-mono font-bold tracking-wider text-left"
              dir="ltr"
              onClick={() => {
                navigator.clipboard?.writeText(
                  String(cardState.cardNumber).replace(/\D/g, ''),
                );
              }}
            >
              {cardState.cardNumber}
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-7">
          مبلغ را واریز کنید، سپس ۴ رقم آخر کارت مبدأ را وارد کنید.
        </p>
        <Input
          label="۴ رقم آخر کارت مبدأ"
          dir="ltr"
          inputMode="numeric"
          maxLength={4}
          placeholder="1234"
          value={cardLast4}
          onChange={(e) =>
            setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <Button
          className="w-full"
          style={{ backgroundColor: primaryColor }}
          loading={loading}
          disabled={cardLast4.length !== 4}
          onClick={submitCardProof}
        >
          ثبت اطلاعات واریز
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="flex border-b border-border">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className={cn('flex-1 h-1.5', step >= n ? 'bg-primary' : 'bg-muted')}
            style={step >= n ? { backgroundColor: primaryColor } : undefined}
          />
        ))}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {step === 1 && 'انتخاب خدمت'}
            {step === 2 && 'انتخاب کارمند'}
            {step === 3 && 'انتخاب تاریخ'}
            {step === 4 && 'انتخاب ساعت'}
            {step === 5 && 'اطلاعات شما'}
            {step === 6 && 'پرداخت'}
          </h3>
          <span className="text-sm text-muted-foreground">
            مرحله {Math.min(step, 6)} از ۶
          </span>
        </div>

        {sessionUser && step === 5 && (
          <p className="text-sm rounded-xl bg-teal-50 border border-teal-100 text-teal-800 px-3 py-2">
            اطلاعات حساب شما به‌صورت خودکار پر شده است.
          </p>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {business.services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStep(2);
                }}
                className={cn(
                  'w-full text-right rounded-xl border p-4 transition-all',
                  serviceId === s.id
                    ? 'border-primary bg-teal-50 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:shadow-sm',
                )}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-base">{s.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {s.durationMinutes} دقیقه
                    </p>
                  </div>
                  <p className="text-base font-black whitespace-nowrap text-primary">
                    {formatRial(s.price)}{' '}
                    <span className="text-sm font-semibold text-muted-foreground">
                      ت
                    </span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMemberId('');
                setStep(3);
              }}
              className={cn(
                'w-full text-right rounded-xl border p-4',
                !memberId
                  ? 'border-primary bg-teal-50'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <p className="font-bold text-base">بدون ترجیح</p>
              <p className="text-sm text-muted-foreground">اولین تایم آزاد</p>
            </button>
            {business.staff.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setMemberId(st.id);
                  setStep(3);
                }}
                className={cn(
                  'w-full text-right rounded-xl border p-4 hover:border-primary/40',
                  memberId === st.id
                    ? 'border-primary bg-teal-50'
                    : 'border-border',
                )}
              >
                <p className="font-bold text-base">{st.name}</p>
                {st.jobTitle && (
                  <p className="text-sm text-muted-foreground">{st.jobTitle}</p>
                )}
              </button>
            ))}
            <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
              بازگشت
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setDate(d.value);
                    setStep(4);
                  }}
                  className={cn(
                    'rounded-xl border p-3.5 text-sm font-bold',
                    date === d.value
                      ? 'border-primary bg-teal-50 text-teal-900'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
              بازگشت
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {slotsLoading && (
              <p className="text-base text-muted-foreground text-center py-6">
                در حال محاسبه تایم‌های آزاد...
              </p>
            )}
            {!slotsLoading && slots.length === 0 && (
              <p className="text-base text-muted-foreground text-center py-6">
                در این روز تایم آزادی نیست (یا همه ساعت‌های باقی‌مانده گذشته‌اند).
              </p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    setStep(5);
                  }}
                  className={cn(
                    'rounded-xl border py-3 text-base font-bold tabular-nums hover:border-primary/40 hover:bg-teal-50',
                    slot?.startsAt === s.startsAt &&
                      'border-primary bg-teal-50 text-teal-900',
                  )}
                  dir="ltr"
                >
                  {s.start}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep(3)}>
              بازگشت
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Input
              label="نام و نام خانوادگی"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              readOnly={Boolean(sessionUser?.firstName)}
            />
            <Input
              label="شماره موبایل"
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="09123456789"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              readOnly={Boolean(sessionUser?.phone)}
            />
            <Input
              label="یادداشت (اختیاری)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(4)}>
                بازگشت
              </Button>
              <Button
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
                disabled={!customerName.trim() || !customerPhone.trim()}
                onClick={() => setStep(6)}
              >
                ادامه
              </Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted p-4 text-base space-y-2">
              <Row label="خدمت" value={service?.name} />
              <Row
                label="زمان"
                value={slot ? formatTehranDateTime(slot.startsAt) : '—'}
              />
              <Row label="نام" value={customerName} />
              <Row
                label="مبلغ"
                value={`${formatRial(service?.price || 0)} تومان`}
              />
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold">روش پرداخت</p>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5',
                  paymentMethod === 'sandbox'
                    ? 'border-primary bg-teal-50'
                    : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === 'sandbox'}
                  onChange={() => setPaymentMethod('sandbox')}
                  className="mt-1 accent-teal-600"
                />
                <span>
                  <span className="block text-base font-bold">
                    درگاه آنلاین
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    پرداخت سریع و قطعی شدن نوبت
                  </span>
                </span>
              </label>
              {hasCard && (
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5',
                    paymentMethod === 'card_to_card'
                      ? 'border-primary bg-teal-50'
                      : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'card_to_card'}
                    onChange={() => setPaymentMethod('card_to_card')}
                    className="mt-1 accent-teal-600"
                  />
                  <span>
                    <span className="block text-base font-bold">کارت‌به‌کارت</span>
                    <span className="block text-sm text-muted-foreground">
                      واریز به کارت + تأیید دستی
                    </span>
                  </span>
                </label>
              )}
            </div>

            {business.cancellationPolicy && (
              <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground leading-7">
                <p className="font-bold text-foreground mb-1">قوانین لغو</p>
                {business.cancellationPolicy}
              </div>
            )}

            <label className="flex items-start gap-2 text-base cursor-pointer">
              <input
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-1 accent-teal-600"
              />
              <span>قوانین رزرو و لغو را می‌پذیرم</span>
            </label>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(5)}>
                بازگشت
              </Button>
              <Button
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
                loading={loading}
                disabled={!policyAccepted}
                onClick={submitBooking}
              >
                {paymentMethod === 'card_to_card'
                  ? 'ادامه واریز'
                  : 'پرداخت آنلاین'}
              </Button>
            </div>
          </div>
        )}

        {error && step !== 8 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-left">{value}</span>
    </div>
  );
}
