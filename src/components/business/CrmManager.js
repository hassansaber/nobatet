'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatRial } from '@/lib/utils';

const TIERS = [
  { id: '', label: 'همه' },
  { id: 'normal', label: 'عادی' },
  { id: 'silver', label: 'نقره‌ای' },
  { id: 'gold', label: 'طلایی' },
  { id: 'vip', label: 'VIP' },
];

const TIER_STYLE = {
  normal: 'bg-slate-100 text-slate-700',
  silver: 'bg-slate-200 text-slate-800',
  gold: 'bg-amber-100 text-amber-900',
  vip: 'bg-purple-100 text-purple-900',
};

export function CrmManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tier, setTier] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState({
    notes: '',
    tags: '',
    tier: 'normal',
    displayName: '',
  });
  const [pointsDelta, setPointsDelta] = useState('50');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (tier) params.set('tier', tier);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/business/crm?${params}`);
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
  }, [tier, q]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(c) {
    setSelected(c);
    setEdit({
      notes: c.notes || '',
      tags: (c.tags || []).join('، '),
      tier: c.tier || 'normal',
      displayName: c.displayName || '',
    });
  }

  async function saveProfile() {
    if (!selected) return;
    setSaving(true);
    try {
      const tags = edit.tags
        .split(/[،,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch('/api/business/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          profileId: selected.id || undefined,
          displayName: edit.displayName,
          notes: edit.notes,
          tags,
          tier: edit.tier,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'ذخیره ناموفق');
        return;
      }
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function adjustPoints() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/business/loyalty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_points',
          phone: selected.phone,
          displayName: selected.displayName,
          points: Number(pointsDelta),
          note: 'تعدیل دستی از پنل CRM',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || 'ناموفق');
        return;
      }
      load();
      setSelected((s) =>
        s
          ? {
              ...s,
              loyaltyPoints: data.profile?.loyaltyPoints ?? s.loyaltyPoints,
            }
          : s,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">CRM مشتریان</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تگ، سطح VIP، یادداشت و امتیاز باشگاه
          </p>
        </div>
        <a
          href="/api/business/export?type=customers"
          className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-xs font-medium hover:bg-muted"
        >
          خروجی Excel (CSV)
        </a>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {TIERS.map((t) => (
          <button
            key={t.id || 'all'}
            type="button"
            onClick={() => setTier(t.id)}
            className={cn(
              'h-8 rounded-lg px-3 text-xs font-medium border',
              tier === t.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-border text-muted-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
        <input
          className="h-9 rounded-xl border border-border px-3 text-sm min-w-[140px] flex-1"
          placeholder="جستجو نام / موبایل / تگ"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="sm" variant="secondary" onClick={load}>
          فیلتر
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {customers.map((c) => (
          <Card key={c.phone}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold truncate">{c.displayName}</p>
                    <span
                      className={cn(
                        'text-[10px] font-bold rounded-full px-2 py-0.5',
                        TIER_STYLE[c.tier] || TIER_STYLE.normal,
                      )}
                    >
                      {c.tier || 'normal'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                    {c.phone}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {c.visits} مراجعه · {formatRial(c.totalSpent)} ت ·{' '}
                    {c.loyaltyPoints || 0} امتیاز
                    {c.lastVisit
                      ? ` · آخرین: ${new Date(c.lastVisit).toLocaleDateString('fa-IR')}`
                      : ''}
                  </p>
                  {(c.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] rounded-md bg-muted px-1.5 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                  ویرایش
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && customers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            مشتری‌ای یافت نشد
          </p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <CardHeader>
              <CardTitle>ویرایش {selected.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="نام نمایشی"
                value={edit.displayName}
                onChange={(e) =>
                  setEdit({ ...edit, displayName: e.target.value })
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">سطح</p>
                <div className="flex flex-wrap gap-2">
                  {['normal', 'silver', 'gold', 'vip'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEdit({ ...edit, tier: t })}
                      className={cn(
                        'h-8 rounded-lg px-3 text-xs border',
                        edit.tier === t
                          ? 'border-primary bg-teal-50'
                          : 'border-border',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="تگ‌ها (با ویرگول)"
                value={edit.tags}
                onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
                placeholder="وفادار، حساس به قیمت"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">یادداشت</label>
                <textarea
                  className="w-full min-h-20 rounded-xl border border-border p-3 text-sm"
                  value={edit.notes}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                />
              </div>
              <div className="rounded-xl bg-muted p-3 space-y-2">
                <p className="text-xs font-medium">
                  امتیاز فعلی: {selected.loyaltyPoints || 0}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={saving}
                    onClick={adjustPoints}
                  >
                    افزودن امتیاز
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  بستن
                </Button>
                <Button className="flex-1" loading={saving} onClick={saveProfile}>
                  ذخیره
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
