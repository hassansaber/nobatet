'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const ROLES = [
  'customer',
  'business_owner',
  'staff',
  'visitor',
  'super_admin',
];

export function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (data.ok) setItems(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(id, role) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });
    load();
  }

  async function toggle(id, isActive) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">کاربران</h1>
      {loading && <p className="text-sm text-muted-foreground">...</p>}
      <div className="space-y-2">
        {items.map((u) => (
          <Card key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') ||
                      '—'}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {u.phone}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggle(u.id, !u.isActive)}
                >
                  {u.isActive ? 'مسدود' : 'فعال'}
                </Button>
              </div>
              <select
                className="h-9 w-full rounded-lg border border-border text-sm px-2"
                value={u.role}
                onChange={(e) => setRole(u.id, e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
