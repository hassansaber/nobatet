'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Handshake, Building2, Briefcase, User, ArrowLeftRight, ChevronDown, LayoutDashboard } from 'lucide-react';

const ICON_MAP = {
  crown: Crown,
  handshake: Handshake,
  building: Building2,
  briefcase: Briefcase,
  user: User,
};

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

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    function onClickOutside(e) { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); }
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

  // Current workspace from cookie or first
  const current = workspaces[0];
  const CurrentIcon = current ? (ICON_MAP[current.icon] || Building2) : Building2;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl glass px-2.5 py-1.5 text-[11px] font-medium hover:bg-white/60 transition-all cursor-pointer min-h-[32px]"
      >
        <span className="size-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: current?.color || '#0284C7' }}>
          <CurrentIcon className="size-3.5" />
        </span>
        <span className="hidden sm:inline max-w-[90px] truncate">{current?.title || 'فضا'}</span>
        <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full">{workspaces.length}</span>
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute top-full mt-2 right-0 z-50 w-80 rounded-2xl border border-white/40 glass-strong shadow-xl p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[11px] font-medium text-muted-foreground">فضاهای کاری شما</p>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{workspaces.length} فضا</span>
          </div>
          <div className="space-y-1 mt-2 max-h-72 overflow-auto">
            {workspaces.map((ws) => {
              const Icon = ICON_MAP[ws.icon] || Building2;
              return (
                <button
                  key={ws.key}
                  role="menuitem"
                  onClick={() => select(ws)}
                  className="w-full text-right flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/60 border border-transparent hover:border-white/40 transition-all cursor-pointer"
                >
                  <span className="size-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ws.color + '18', color: ws.color }}>
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-[12px] font-medium truncate">{ws.title}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">{ws.roleLabel} • {ws.businessSlug || ws.type}</span>
                  </span>
                  <LayoutDashboard className="size-3 text-muted-foreground" />
                </button>
              );
            })}
          </div>
          <div className="border-t border-white/40 mt-2 pt-2 grid grid-cols-2 gap-2">
            <button onClick={() => { setOpen(false); router.push('/choose-workspace'); }} className="text-[11px] font-medium py-2.5 rounded-xl glass hover:bg-white/70 cursor-pointer">
              صفحه انتخاب
            </button>
            <button onClick={() => { setOpen(false); router.push('/business'); }} className="text-[11px] font-medium py-2.5 rounded-xl bg-primary text-white hover:bg-secondary cursor-pointer">
              + کسب‌وکار جدید
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
