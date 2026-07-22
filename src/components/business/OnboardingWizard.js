'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, Sparkles, ArrowLeft, PartyPopper } from 'lucide-react';

export function OnboardingWizard({ business }) {
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newService, setNewService] = useState({ name: '', durationMinutes: 60, price: 0 });

  useEffect(() => {
    try {
      const key = `nobatet_onboard_dismissed_${business.id}`;
      if (localStorage.getItem(key)) setDismissed(true);
    } catch {}

    (async () => {
      try {
        const res = await fetch(`/api/business/services?businessId=${business.id}`);
        const data = await res.json();
        if (data.ok) setServices(data.services || []);
      } catch {}
    })();
  }, [business.id]);

  if (dismissed) return null;
  if (services.length > 2) return null; // اگر بیشتر از ۲ خدمت دارد، onboarding لازم نیست

  function dismiss() {
    try {
      localStorage.setItem(`nobatet_onboard_dismissed_${business.id}`, '1');
    } catch {}
    setDismissed(true);
  }

  async function createFirstService(e) {
    e.preventDefault();
    if (!newService.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/business/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: newService.name,
          durationMinutes: Number(newService.durationMinutes),
          price: Number(newService.price),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setServices((prev) => [...prev, data.service]);
        setStep(3);
      }
    } catch {} finally { setLoading(false); }
  }

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] flex items-center gap-2">
          <span className="size-6 rounded-lg bg-primary text-white flex items-center justify-center"><Sparkles className="size-3.5" /></span>
          راه‌اندازی سریع - ۳ قدم تا اولین رزرو
          <span className="mr-auto text-[10px] bg-white border px-2 py-0.5 rounded-full">مرحله {step} از ۳</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {[1,2,3].map((n) => (
            <div key={n} className={`flex-1 h-1.5 rounded-full ${step >= n ? 'bg-primary' : 'bg-white/60'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[12px] leading-6">سلام! {business.name} ساخته شد - لینک لندینگ شما <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-[11px]" dir="ltr">{business.slug}.nobatet.com</span></p>
            <p className="text-[11px] text-muted-foreground">قدم اول: ساعات کاری را چک کن</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => setStep(2)}>ادامه</Button>
              <Button size="sm" variant="secondary" onClick={dismiss}>رد کردن</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={createFirstService} className="space-y-3">
            <p className="text-[12px] font-medium">اولین خدمت خود را بسازید</p>
            <Input label="نام خدمت *" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="مثلا کوتاهی مو" required />
            <div className="grid grid-cols-2 gap-2">
              <Input label="مدت (دقیقه)" type="number" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} />
              <Input label="قیمت (تومان)" type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>بازگشت</Button>
              <Button type="submit" loading={loading} className="flex-1">ساخت خدمت</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-3 text-center py-2">
            <div className="size-12 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto"><PartyPopper className="size-6" /></div>
            <p className="font-bold text-[13px]">عالی! آماده‌ای</p>
            <p className="text-[11px] text-muted-foreground">حالا لینک لندینگ را در اینستاگرام بگذار - مشتری می‌تواند همین الان رزرو کند.</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => { dismiss(); window.location.href = `/business/qr`; }}>دریافت QR</Button>
              <Button size="sm" variant="secondary" className="flex-1" onClick={dismiss}>بستن</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
