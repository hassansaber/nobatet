'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/workspaces', { credentials: 'include' });
        const data = await res.json();
        if (data.ok) setWorkspaces(data.dashboards || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading || workspaces.length <= 1) return null;

  function select(ws) {
    try {
      document.cookie = `nobatet_active_workspace=${encodeURIComponent(ws.businessId || ws.type)}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    } catch {}
    setOpen(false);
    router.push(ws.href);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold hover:border-primary transition-colors">
        <span className="size-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">⇄</span>
        سوییچ فضا ({workspaces.length})
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 w-72 rounded-2xl border border-border bg-white shadow-xl p-2">
          <p className="text-[11px] text-muted-foreground px-2 py-1">فضاهای کاری شما</p>
          <div className="space-y-1 mt-1 max-h-64 overflow-auto">
            {workspaces.map((ws) => (
              <button key={ws.key} onClick={() => select(ws)} className="w-full text-right flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 border border-transparent hover:border-border transition-colors">
                <span className="size-8 rounded-xl flex items-center justify-center text-sm" style={{ backgroundColor: ws.color + '20', color: ws.color }}>{ws.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold truncate">{ws.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{ws.roleLabel} • {ws.desc?.slice(0, 30)}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t mt-2 pt-2">
            <button onClick={() => { setOpen(false); router.push('/choose-workspace'); }} className="w-full text-center text-xs text-primary font-bold py-1.5 hover:underline">
              نمایش همه در صفحه انتخاب →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
