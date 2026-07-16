'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/customers');
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا');
        return;
      }
      setCustomers(data.customers || []);
    } catch {
      setError('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">مشتریان</h1>
      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && customers.length === 0 && (
        <p className="text-sm text-muted-foreground">هنوز مشتری‌ای ثبت نشده</p>
      )}
      <div className="space-y-2">
        {customers.map((c) => (
          <Card key={c.customerPhone}>
            <CardContent className="py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{c.customerName || '—'}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {c.customerPhone}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {c.visits} مراجعه
                  {c.lastVisit
                    ? ` · آخرین: ${new Date(c.lastVisit).toLocaleDateString('fa-IR')}`
                    : ''}
                </p>
              </div>
              <p className="text-sm font-bold whitespace-nowrap">
                {formatRial(c.totalSpent)} ت
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
