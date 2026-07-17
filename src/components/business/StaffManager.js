'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { cn } from '@/lib/utils';

export function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
  const [form, setForm] = useState({ phone: '', firstName: '', lastName: '', jobTitle: '', role: 'staff', avatarUrl: '' });
=======
  const [form, setForm] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    role: 'staff',
    avatarUrl: '',
  });
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
  const [editingId, setEditingId] = useState(null);
  const [editAvatar, setEditAvatar] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sRes, vRes] = await Promise.all([fetch('/api/business/staff'), fetch('/api/business/services')]);
      const sData = await sRes.json(); const vData = await vRes.json();
      if (!sData.ok) { setError(sData.error || 'خطا'); return; }
      setStaff(sData.staff || []); setServices(vData.services || []);
    } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch('/api/business/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'افزودن ناموفق'); return; }
      if (form.avatarUrl && data.member?.id) {
        await fetch('/api/business/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: data.member.id, avatarUrl: form.avatarUrl }) }).catch(()=>{});
      }
      // if avatarUrl provided, update member immediately
      if (form.avatarUrl) {
        await fetch('/api/business/staff', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: data.member?.id || data.user?.id, avatarUrl: form.avatarUrl }),
        }).catch(()=>{});
      }
      setShowForm(false);
      setForm({ phone: '', firstName: '', lastName: '', jobTitle: '', role: 'staff', avatarUrl: '' });
      load();
    } catch { setError('خطای شبکه'); } finally { setSaving(false); }
  }

  async function toggleActive(member) {
<<<<<<< HEAD
    await fetch('/api/business/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: member.id, isActive: !member.isActive }) });
=======
    await fetch('/api/business/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, isActive: !member.isActive }),
    });
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
    load();
  }

  async function saveAvatar(memberId) {
    if (!editAvatar) return;
    setSaving(true);
<<<<<<< HEAD
    await fetch('/api/business/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, avatarUrl: editAvatar }) });
    setEditingId(null); setEditAvatar(''); setSaving(false); load();
=======
    await fetch('/api/business/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, avatarUrl: editAvatar }),
    });
    setEditingId(null);
    setEditAvatar('');
    setSaving(false);
    load();
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
<<<<<<< HEAD
        <h1 className="text-xl font-black">کارمندان • آپلود تصویر</h1>
=======
        <h1 className="text-xl font-black">کارمندان</h1>
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'بستن' : 'افزودن نیرو'}</Button>
      </div>

      {showForm && (
        <Card>
<<<<<<< HEAD
          <CardHeader><CardTitle>عضو جدید — با آپلود تصویر</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
=======
          <CardHeader><CardTitle>عضو جدید</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
              <Input label="موبایل" dir="ltr" placeholder="0912..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <Input label="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <Input label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <Input label="عنوان شغلی" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="آرایشگر، منشی..." />
<<<<<<< HEAD
              <ImageUploader label="تصویر کارمند (آپلود مستقیم)" value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} type="staff" accept="image/*" hint="تصویر پرسنلی — 400x400 WebP بهینه می‌شود" />
=======
              <Input label="تصویر کارمند (URL)" dir="ltr" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://.../avatar.jpg یا خالی" />
              {form.avatarUrl && <img src={form.avatarUrl} alt="avatar preview" className="size-20 rounded-full border object-cover" />}
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
              <div className="space-y-1">
                <p className="text-sm font-medium">نقش</p>
                <div className="flex gap-2">
                  {[{ id: 'staff', label: 'کارمند' }, { id: 'manager', label: 'مدیر' }].map((r) => (
                    <button key={r.id} type="button" onClick={() => setForm({ ...form, role: r.id })} className={cn('h-9 rounded-lg border px-3 text-sm', form.role === r.id ? 'border-primary bg-teal-50' : 'border-border')}>{r.label}</button>
                  ))}
                </div>
              </div>
<<<<<<< HEAD
              <p className="text-[11px] text-muted-foreground">اگر کاربر جدید باشد با رمز ۱۲۳۴۵۶ ساخته می‌شود. می‌توانید بعدا تصویرش را تغییر دهید.</p>
              <Button type="submit" className="w-full" loading={saving}>ذخیره کارمند</Button>
=======
              <p className="text-[11px] text-muted-foreground">اگر کاربر جدید باشد با رمز پیش‌فرض ۱۲۳۴۵۶ ساخته می‌شود.</p>
              <Button type="submit" className="w-full" loading={saving}>ذخیره</Button>
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
            </form>
          </CardContent>
        </Card>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}

      <div className="space-y-3">
        {staff.map((m) => (
          <Card key={m.id} className={!m.isActive ? 'opacity-60' : ''}>
            <CardContent className="py-4 flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="relative size-14 rounded-full overflow-hidden bg-slate-100 border shrink-0">
                  <img src={m.avatarUrl || m.userAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.firstName || m.phone)}`} alt={m.firstName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{[m.firstName, m.lastName].filter(Boolean).join(' ') || 'بدون نام'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="ltr">{m.phone}{m.jobTitle ? ` · ${m.jobTitle}` : ''} {` · ${m.role}`}</p>
<<<<<<< HEAD
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">خدمات: {m.serviceIds?.length ? m.serviceIds.map((id) => services.find((s) => s.id === id)?.name || '…').join('، ') : '—'}</p>
                  {editingId === m.id ? (
                    <div className="mt-3 space-y-2">
                      <ImageUploader label="تغییر تصویر" value={editAvatar} onChange={setEditAvatar} type="staff" accept="image/*" />
                      <div className="flex gap-2"><Button size="sm" onClick={()=>saveAvatar(m.id)} loading={saving}>ذخیره تصویر</Button><Button size="sm" variant="secondary" onClick={()=>{setEditingId(null); setEditAvatar('');}}>لغو</Button></div>
                    </div>
                  ) : (
                    <button onClick={()=>{setEditingId(m.id); setEditAvatar(m.avatarUrl || m.userAvatarUrl || '');}} className="mt-2 text-[11px] text-primary font-bold hover:underline">🖼️ تغییر تصویر با آپلود</button>
=======
                  <p className="text-[11px] text-muted-foreground mt-1truncate">خدمات: {m.serviceIds?.length ? m.serviceIds.map((id) => services.find((s) => s.id === id)?.name || '…').join('، ') : '—'}</p>
                  {editingId === m.id ? (
                    <div className="mt-3 flex gap-2">
                      <input value={editAvatar} onChange={(e)=>setEditAvatar(e.target.value)} placeholder="URL تصویر جدید" className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs" dir="ltr" />
                      <Button size="sm" onClick={()=>saveAvatar(m.id)} loading={saving}>ذخیره</Button>
                      <Button size="sm" variant="secondary" onClick={()=>{setEditingId(null); setEditAvatar('');}}>لغو</Button>
                    </div>
                  ) : (
                    <button onClick={()=>{setEditingId(m.id); setEditAvatar(m.avatarUrl || m.userAvatarUrl || '');}} className="mt-2 text-[11px] text-primary font-bold hover:underline">🖼️ تغییر تصویر</button>
>>>>>>> 9d6d93e73c6231c2566720c9f0cd6f64dd9dc55d
                  )}
                </div>
              </div>
              <Button size="sm" variant={m.isActive ? 'secondary' : 'primary'} onClick={() => toggleActive(m)} disabled={m.role === 'owner'}>{m.isActive ? 'غیرفعال' : 'فعال'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
