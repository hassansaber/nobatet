'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function GiftCardsManager() {
  const [list, setList] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [amount, setAmount] = useState('200000');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const sRes = await fetch('/api/business/settings');
      const sData = await sRes.json();
      const bId = sData.business?.id;
      if (!bId) return;
      setBusinessId(bId);
      const res = await fetch(`/api/business/gift-cards?businessId=${bId}`);
      const data = await res.json();
      if (data.ok) setList(data.giftCards || []);
    })();
  }, []);

  async function create(e) {
    e.preventDefault();
    const res = await fetch('/api/business/gift-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, amount: Number(amount), customerPhone: phone || null, customerName: name || null }) });
    const data = await res.json();
    if (data.ok) setList((prev) => [data.giftCard, ...prev]);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black">کارت هدیه</h1>
      <Card><CardHeader><CardTitle className="text-sm">ساخت کارت هدیه جدید</CardTitle></CardHeader><CardContent>
        <form onSubmit={create} className="grid sm:grid-cols-4 gap-2">
          <Input label="مبلغ (تومان)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="موبایل گیرنده (اختیاری)" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="نام گیرنده" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" className="h-10 self-end">ساخت کد</Button>
        </form>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-sm">کارت‌ها ({list.length})</CardTitle></CardHeader><CardContent className="space-y-2">
        {list.map((g) => (
          <div key={g.id} className="flex justify-between items-center rounded-xl border p-2.5">
            <div><p className="font-mono font-bold text-sm">{g.code} • {g.amount} ت</p><p className="text-[11px] text-muted-foreground">مانده {g.balance} • {g.customerName || '—'} • {g.isActive ? 'فعال' : 'غیرفعال'}</p></div>
            <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => navigator.clipboard?.writeText(g.code)}>کپی کد</Button>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
