'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

const CATS = {
  rent: '🏠 اجاره',
  salary: '👥 حقوق',
  purchase: '🛒 خرید',
  marketing: '📢 تبلیغات',
  bills: '💡 قبوض',
  other: '📦 سایر',
};

export function ExpensesManager() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', description: '', expenseDate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/expenses?days=${days}`);
      const data = await res.json();
      if (data.ok) { setExpenses(data.expenses); setSummary(data.summary); }
    } catch {} finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/business/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.ok) {
        setForm({ title: '', amount: '', category: 'other', description: '', expenseDate: '' });
        load();
      } else alert(data.error || 'خطا');
    } catch { alert('خطای شبکه'); } finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('حذف شود؟')) return;
    await fetch(`/api/business/expenses?id=${id}`, { method: 'DELETE' });
    load();
  }

  const maxCat = Math.max(1, ...Object.values(summary.byCategory || {}));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">حسابداری هزینه‌ها</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`h-8 px-3 rounded-lg border text-xs ${days === d ? 'bg-primary text-white border-primary' : 'bg-white'}`}>{d} روز</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-1"><p className="text-xs text-muted-foreground">کل هزینه {days} روز</p></CardHeader><CardContent><p className="text-2xl font-black">{formatRial(summary.total)} <span className="text-xs font-normal">تومان</span></p><p className="text-[11px] text-muted-foreground">{summary.count} تراکنش</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><p className="text-xs text-muted-foreground">میانگین روزانه</p></CardHeader><CardContent><p className="text-2xl font-black">{formatRial(Math.round(summary.total / (days || 1)))} </p><p className="text-[11px] text-muted-foreground">تومان / روز</p></CardContent></Card>
        <Card className="bg-slate-900 text-white border-slate-900"><CardHeader className="pb-1"><p className="text-xs text-slate-400">بیشترین دسته</p></CardHeader><CardContent><p className="text-lg font-black">{Object.entries(summary.byCategory || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] ? CATS[Object.entries(summary.byCategory).sort((a,b)=>b[1]-a[1])[0][0]] || Object.entries(summary.byCategory).sort((a,b)=>b[1]-a[1])[0][0] : '—'}</p></CardContent></Card>
      </div>

      {Object.keys(summary.byCategory || {}).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">تفکیک دسته‌ای</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.byCategory).map(([cat, amt]) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs"><span>{CATS[cat] || cat}</span><span className="font-bold">{formatRial(amt)} ت</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.round((amt / maxCat) * 100)}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">ثبت هزینه جدید</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="عنوان هزینه" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلا اجاره ماه، خرید رنگ مو" required />
              <Input label="مبلغ (تومان)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500000" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">دسته</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border p-2.5 text-sm">
                  {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <Input label="تاریخ (اختیاری)" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border p-2.5 text-sm min-h-[60px]" placeholder="اختیاری..." />
            </div>
            <Button type="submit" loading={saving} className="w-full">ثبت هزینه</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">لیست هزینه‌ها ({expenses.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-auto">
          {loading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
          {expenses.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{ex.title} <span className="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded-full">{CATS[ex.category] || ex.category}</span></p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(ex.expenseDate).toLocaleDateString('fa-IR')} • {ex.description || '—'}</p>
              </div>
              <div className="text-left">
                <p className="font-black">{formatRial(ex.amount)} ت</p>
                <button onClick={() => del(ex.id)} className="text-[11px] text-red-600 hover:underline">حذف</button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && !loading && <p className="text-xs text-muted-foreground text-center py-6">هنوز هزینه‌ای ثبت نشده</p>}
        </CardContent>
      </Card>
    </div>
  );
}
