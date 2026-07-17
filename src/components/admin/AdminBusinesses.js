'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export function AdminBusinesses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/businesses');
    const data = await res.json();
    if (data.ok) setItems(data.businesses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(id, isActive) {
    await fetch('/api/admin/businesses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">مدیریت بیزنس‌ها</h1>
      {loading && <p className="text-sm text-muted-foreground">...</p>}
      <div className="space-y-2">
        {items.map((b) => (
          <Card key={b.id} className={!b.isActive ? 'opacity-60' : ''}>
            <CardContent className="py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{b.slug} · {b.ownerName || b.ownerPhone}
                  {b.subscription
                    ? ` · ${b.subscription.planName} (${b.subscription.status})`
                    : ' · بدون اشتراک'}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggle(b.id, !b.isActive)}
              >
                {b.isActive ? 'غیرفعال' : 'فعال'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
