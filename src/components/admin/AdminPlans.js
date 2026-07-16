'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/plans');
    const data = await res.json();
    if (data.ok) setPlans(data.plans || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(plan) {
    await fetch('/api/admin/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
    });
    load();
  }

  async function updatePrice(plan, priceMonthly) {
    await fetch('/api/admin/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, priceMonthly: Number(priceMonthly) }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">پلن‌های اشتراک</h1>
      {loading && <p className="text-sm text-muted-foreground">...</p>}
      <div className="space-y-3">
        {plans.map((p) => (
          <Card key={p.id} className={!p.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {p.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({p.code})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{p.description}</p>
              <p>
                ماهانه: <strong>{formatRial(p.priceMonthly)}</strong> ت · تا{' '}
                {p.maxStaff} کارمند
              </p>
              <div className="flex flex-wrap gap-2 items-end">
                <Input
                  label="قیمت ماهانه"
                  type="number"
                  defaultValue={p.priceMonthly}
                  className="w-36"
                  onBlur={(e) => {
                    if (Number(e.target.value) !== p.priceMonthly) {
                      updatePrice(p, e.target.value);
                    }
                  }}
                />
                <Button size="sm" variant="secondary" onClick={() => toggle(p)}>
                  {p.isActive ? 'غیرفعال' : 'فعال'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
