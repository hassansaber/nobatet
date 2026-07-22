'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function InvitesManager() {
  const [businessId, setBusinessId] = useState(null);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [invites, setInvites] = useState([]);
  const [lastUrl, setLastUrl] = useState('');

  useEffect(() => {
    (async () => {
      const sRes = await fetch('/api/business/settings');
      const sData = await sRes.json();
      const bId = sData.business?.id;
      if (!bId) return;
      setBusinessId(bId);
      const res = await fetch(`/api/business/invites?businessId=${bId}`);
      const data = await res.json();
      if (data.ok) setInvites(data.invites || []);
    })();
  }, []);

  async function create(e) {
    e.preventDefault();
    const res = await fetch('/api/business/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, emailOrPhone, role }) });
    const data = await res.json();
    if (data.ok) {
      setInvites((prev) => [data.invite, ...prev]);
      setLastUrl(data.inviteUrl);
      setEmailOrPhone('');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black">دعوت اعضای تیم - RBAC پیشرفته</h1>
      <p className="text-xs text-muted-foreground">به جای ساخت کاربر با شماره، لینک دعوت بفرست - کارمند با کلیک عضو می‌شود و نقش manager/staff می‌گیرد.</p>

      <Card><CardHeader><CardTitle className="text-sm">ساخت دعوت جدید</CardTitle></CardHeader><CardContent>
        <form onSubmit={create} className="grid sm:grid-cols-3 gap-2">
          <Input label="موبایل یا ایمیل" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required placeholder="0912... یا email" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border p-2.5 text-sm h-10 self-end">
            <option value="staff">کارمند (staff)</option>
            <option value="manager">مدیر (manager)</option>
          </select>
          <Button type="submit" className="self-end h-10">ساخت لینک دعوت</Button>
        </form>
        {lastUrl && <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-xl text-xs break-all" dir="ltr">{lastUrl} <Button size="sm" variant="secondary" className="mr-2 h-6 text-[10px]" onClick={() => navigator.clipboard?.writeText(lastUrl)}>کپی</Button></div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-sm">دعوت‌ها ({invites.length})</CardTitle></CardHeader><CardContent className="space-y-2">
        {invites.map((inv) => (
          <div key={inv.id} className="flex justify-between items-center rounded-xl border p-2.5">
            <div><p className="text-xs font-medium">{inv.emailOrPhone} • {inv.role}</p><p className="text-[10px] text-muted-foreground">{inv.isAccepted ? 'پذیرفته شده' : 'در انتظار'} • {new Date(inv.expiresAt).toLocaleDateString('fa-IR')}</p></div>
            <span className="text-[10px] font-mono bg-slate-100 border px-2 py-1 rounded-full">{inv.token.slice(0,8)}...</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
