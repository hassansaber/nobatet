'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/workspaces', { credentials: 'include' });
        const data = await res.json();
        if (data.ok) setWorkspaces(data.dashboards || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  // Close on Escape and click outside
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onClickOutside);
      return () => {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('mousedown', onClickOutside);
      };
    }
  }, [open]);

  if (loading || workspaces.length <= 1) return null;

  function select(ws) {
    try {
      document.cookie = `nobatet_active_workspace=${encodeURIComponent(ws.businessId || ws.type)}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    } catch {}
    setOpen(false);
    router.push(ws.href);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`سوییچ فضای کاری، ${workspaces.length} فضا`}
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold hover:border-primary hover:bg-slate-50 transition-all cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="size-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]" aria-hidden>⇄</span>
        <span>فضا ({workspaces.length})</span>
      </button>
      {open && (
        <div role="menu" aria-label="فضاهای کاری" className="absolute top-full mt-2 right-0 z-50 w-72 rounded-2xl border border-border bg-white shadow-xl p-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-[11px] text-muted-foreground px-2 py-1" id="ws-label">فضاهای کاری شما</p>
          <div className="space-y-1 mt-1 max-h-64 overflow-auto" aria-labelledby="ws-label">
            {workspaces.map((ws) => (
              <button
                key={ws.key}
                role="menuitem"
                onClick={() => select(ws)}
                className="w-full text-right flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 border border-transparent hover:border-border transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-left"
              >
                <span className="size-8 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: ws.color + '20', color: ws.color }} aria-hidden>{ws.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold truncate">{ws.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{ws.roleLabel} • {ws.desc?.slice(0, 30)}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t mt-2 pt-2">
            <button role="menuitem" onClick={() => { setOpen(false); router.push('/choose-workspace'); }} className="w-full text-center text-xs text-primary font-bold py-2.5 rounded-xl hover:bg-teal-50 cursor-pointer min-h-[44px]">
              نمایش همه در صفحه انتخاب →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
