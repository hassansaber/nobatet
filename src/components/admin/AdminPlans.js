'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatRial } from '@/lib/utils';

export function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/plans');
    const data = await res.json();
    if (data.ok) setPlans(data.plans || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveField(plan, patch) {
    await fetch('/api/admin/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, ...patch }),
    });
    load();
  }

  async function toggle(plan) {
    await saveField(plan, { isActive: !plan.isActive });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">پلن‌های اشتراک (پایه، حرفه‌ای، سازمانی)</h1>
        <Button size="sm" onClick={load} variant="secondary"> بروزرسانی</Button>
      </div>
      <p className="text-sm text-muted-foreground">هر پلن ۱ماهه، ۳ماهه، ۱ساله دارد + محدودیت پیامک و کارمند (Task 7,8)</p>
      
      {loading && <p className="text-sm text-muted-foreground">...</p>}
      <div className="grid gap-4 md:grid-cols-1">
        {plans.map((p) => (
          <Card key={p.id} className={!p.isActive ? 'opacity-60' : 'border-teal-100'}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {p.name}
                  <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">{p.tier || p.code}</span>
                  <span className="text-xs font-normal text-muted-foreground">({p.code})</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(editing === p.id ? null : p.id)}>{editing === p.id ? 'بستن' : 'ویرایش پیشرفته'}</Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {editing === p.id ? (
                <div className="space-y-4 rounded-xl bg-slate-50 p-4 border">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input label="نام پلن" defaultValue={p.name} onBlur={(e)=>saveField(p,{name:e.target.value})} />
                    <Input label="توضیح کوتاه" defaultValue={p.description} onBlur={(e)=>saveField(p,{description:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-medium">توضیحات کامل (برای سوپرادمین)</label>
                    <textarea defaultValue={p.longDescription || ''} onBlur={(e)=>saveField(p,{longDescription:e.target.value})} className="w-full rounded-xl border border-border p-2.5 text-sm min-h-[80px]" placeholder="توضیحات بلند پلن..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="ماهانه (تومان)" type="number" defaultValue={p.priceMonthly} onBlur={(e)=>saveField(p,{priceMonthly:Number(e.target.value)})} />
                    <Input label="۳ ماهه (تومان)" type="number" defaultValue={p.price3Months || p.priceMonthly*3*0.9} onBlur={(e)=>saveField(p,{price3Months:Number(e.target.value)})} />
                    <Input label="سالانه (تومان)" type="number" defaultValue={p.priceYearly} onBlur={(e)=>saveField(p,{priceYearly:Number(e.target.value)})} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="حداکثر کارمند" type="number" defaultValue={p.maxStaff} onBlur={(e)=>saveField(p,{maxStaff:Number(e.target.value)})} />
                    <Input label="حداکثر پیامک/ماه" type="number" defaultValue={p.maxSmsPerMonth} onBlur={(e)=>saveField(p,{maxSmsPerMonth:Number(e.target.value)})} />
                    <Input label="حداکثر خدمت" type="number" defaultValue={p.maxServices} onBlur={(e)=>saveField(p,{maxServices:Number(e.target.value)})} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={p.isActive ? 'secondary' : 'primary'} onClick={() => toggle(p)}>{p.isActive ? 'غیرفعال کن' : 'فعال کن'}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1">ماه: {formatRial(p.priceMonthly)} ت</span>
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1">۳ماهه: {formatRial(p.price3Months || p.priceMonthly*3)} ت</span>
                    <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1">سال: {formatRial(p.priceYearly || p.priceMonthly*12)} ت</span>
                  </div>
                  <p className="text-xs">تا {p.maxStaff} کارمند • {p.maxSmsPerMonth || '—'} پیامک/ماه • {p.maxServices} خدمت</p>
                  {p.longDescription && <p className="text-xs text-muted-foreground leading-6 bg-white border rounded-lg p-2">{p.longDescription}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggle(p)}>{p.isActive ? 'غیرفعال' : 'فعال'}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4 text-xs leading-6">
          <p className="font-bold">💡 نکته Task 7:</p>
          <p>پیامک‌های مصرفی از جدول sms_logs محاسبه می‌شود. در داشبورد مالک و سوپرادمین نمایش داده می‌شود و پلن بر اساس آن محدود می‌شود.</p>
        </CardContent>
      </Card>
    </div>
  );
}
