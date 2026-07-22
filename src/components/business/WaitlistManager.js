'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function WaitlistManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const sRes = await fetch('/api/business/settings');
        const sData = await sRes.json();
        const bId = sData.business?.id;
        if (!bId) return;
        setBusinessId(bId);
        const res = await fetch(`/api/business/waitlist?businessId=${bId}`);
        const data = await res.json();
        if (data.ok) setList(data.waitlist || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  async function updateStatus(id, status) {
    try {
      const res = await fetch('/api/business/waitlist', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const data = await res.json();
      if (data.ok) setList((prev) => prev.map((w) => w.id === id ? data.waitlist : w));
    } catch {}
  }

  if (loading) return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black">لیست انتظار - وقتی تایم پر است</h1>
      <p className="text-xs text-muted-foreground">مشتریانی که در لندینگ وقتی اسلات پر بود روی "در لیست انتظار بگذار" زدند.</p>
      <Card><CardHeader><CardTitle className="text-sm">مشتریان در انتظار ({list.length})</CardTitle></CardHeader><CardContent className="space-y-2">
        {list.length === 0 && <p className="text-xs text-muted-foreground">لیست خالی است</p>}
        {list.map((w) => (
          <div key={w.id} className="flex items-center justify-between rounded-xl border p-2.5">
            <div><p className="font-medium text-xs">{w.customerName || '—'} • {w.customerPhone}</p><p className="text-[11px] text-muted-foreground">{w.status} • {new Date(w.createdAt).toLocaleDateString('fa-IR')}</p></div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => updateStatus(w.id, 'contacted')}>تماس گرفتم</Button>
              <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => updateStatus(w.id, 'converted')}>تبدیل شد</Button>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
