'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Crown, Handshake, Building2, Briefcase, User, Sparkles, Search, Plus, ArrowLeft, Clock, Shield } from 'lucide-react';

const ICON_MAP = {
  crown: Crown,
  handshake: Handshake,
  building: Building2,
  briefcase: Briefcase,
  user: User,
};

export function ChooseWorkspaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [workspaces, setWorkspaces] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/workspaces', { credentials: 'include' });
        const data = await res.json();
        if (!data.ok) { setError(data.error || 'خطا'); return; }
        setWorkspaces(data);
      } catch { setError('ارتباط برقرار نشد'); } finally { setLoading(false); }
    })();
  }, []);

  function handleSelect(ws) {
    try {
      document.cookie = `nobatet_active_workspace=${encodeURIComponent(ws.businessId || ws.type)}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
      localStorage.setItem('nobatet_last_workspace', ws.key);
    } catch {}
    const target = next || ws.href || ws.redirectTo || '/me';
    router.push(target);
  }

  const filtered = useMemo(() => {
    if (!workspaces?.dashboards) return [];
    if (!query.trim()) return workspaces.dashboards;
    const q = query.toLowerCase();
    return workspaces.dashboards.filter(ws => 
      ws.title?.toLowerCase().includes(q) || 
      ws.businessSlug?.toLowerCase().includes(q) ||
      ws.roleLabel?.toLowerCase().includes(q)
    );
  }, [workspaces, query]);

  const grouped = useMemo(() => {
    const groups = { business: [], global: [], personal: [] };
    filtered.forEach(ws => {
      if (ws.type === 'business') groups.business.push(ws);
      else if (ws.type === 'global') groups.global.push(ws);
      else groups.personal.push(ws);
    });
    return groups;
  }, [filtered]);

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[13px] text-muted-foreground mt-3">در حال بارگذاری فضاهای کاری...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full"><CardContent className="py-6 text-center"><p className="text-sm text-red-600">{error}</p><Button size="sm" className="mt-3" onClick={()=>location.reload()}>تلاش مجدد</Button></CardContent></Card>
    </div>
  );
  
  if (!workspaces) return null;

  const { dashboards, session, total } = workspaces;
  const lastKey = typeof window !== 'undefined' ? localStorage.getItem('nobatet_last_workspace') : null;

  return (
    <div className="min-h-dvh bg-[#F8FAFC] relative">
      {/* subtle bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#E0F2FE_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#CCFBF1_0%,_transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header - user profile like Slack */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <User className="size-6" />
            </div>
            <div>
              <h1 className="font-lalezar text-[18px] tracking-tight" style={{ fontFamily: 'var(--font-lalezar)' }}>
                سلام، {session?.firstName || 'کاربر'} 👋
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                {session?.phone} • {total} فضای کاری فعال
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 text-[12px]" onClick={()=>router.push('/me')}>
              پروفایل
            </Button>
            <Button size="sm" className="h-9 text-[12px] gap-1" onClick={()=>router.push('/business')}>
              <Plus className="size-3.5" />
              کسب‌وکار جدید
            </Button>
          </div>
        </div>

        {/* Search - like Notion/Linear command palette */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="جستجو بین فضاها، اسلاگ، نقش..."
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-white/40 glass-strong text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl glass p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Building2 className="size-3" /> کسب‌وکار</p>
            <p className="text-[18px] font-medium mt-1">{grouped.business.length}</p>
          </div>
          <div className="rounded-xl glass p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Crown className="size-3" /> نقش جهانی</p>
            <p className="text-[18px] font-medium mt-1">{grouped.global.length}</p>
          </div>
          <div className="rounded-xl glass p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> آخرین ورود</p>
            <p className="text-[12px] font-medium mt-1 truncate">{lastKey ? dashboards.find(d=>d.key===lastKey)?.title || '—' : '—'}</p>
          </div>
        </div>

        {/* Grouped workspaces */}
        <div className="space-y-8">
          {grouped.business.length > 0 && (
            <section>
              <h2 className="font-lalezar text-[14px] flex items-center gap-2 mb-3">
                <Building2 className="size-4 text-primary" />
                کسب‌وکارها ({grouped.business.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped.business.map(ws => {
                  const Icon = ICON_MAP[ws.icon] || Building2;
                  const isLast = ws.key === lastKey;
                  return (
                    <button key={ws.key} onClick={()=>handleSelect(ws)} className="group text-right rounded-2xl glass-strong p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left relative overflow-hidden cursor-pointer border border-white/50">
                      {isLast && <span className="absolute top-2 left-2 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">آخرین</span>}
                      <div className="flex items-start justify-between">
                        <div className="size-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: ws.color + '15', color: ws.color }}>
                          <Icon className="size-5" />
                        </div>
                        <span className="text-[10px] bg-white border border-white/40 px-2 py-0.5 rounded-full shadow-sm">{ws.roleLabel}</span>
                      </div>
                      <p className="mt-3 font-medium text-[13px] truncate">{ws.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[28px]">{ws.desc}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="size-1 rounded-full bg-green-500" /> {ws.businessSlug}</span>
                        <span className="text-[11px] font-medium text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">ورود <ArrowLeft className="size-3" /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {grouped.global.length > 0 && (
            <section>
              <h2 className="font-lalezar text-[14px] flex items-center gap-2 mb-3">
                <Shield className="size-4 text-slate-700" />
                دسترسی‌های ویژه
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {grouped.global.map(ws => {
                  const Icon = ICON_MAP[ws.icon] || Crown;
                  return (
                    <button key={ws.key} onClick={()=>handleSelect(ws)} className="group text-right rounded-2xl bg-slate-900 text-white p-4 hover:bg-slate-800 hover:shadow-lg transition-all text-left cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[13px]">{ws.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ws.desc}</p>
                        </div>
                        <ArrowLeft className="size-4 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {grouped.personal.length > 0 && (
            <section>
              <h2 className="font-lalezar text-[14px] flex items-center gap-2 mb-3">
                <User className="size-4 text-primary" />
                شخصی
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped.personal.map(ws => {
                  const Icon = ICON_MAP[ws.icon] || User;
                  return (
                    <button key={ws.key} onClick={()=>handleSelect(ws)} className="group text-right rounded-2xl glass p-4 hover:shadow-md transition-all text-left cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[13px]">{ws.title}</p>
                          <p className="text-[11px] text-muted-foreground">{ws.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Help card like Linear */}
        <Card className="mt-10 glass border-white/40">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="size-4 text-primary" /></div>
              <div>
                <p className="text-[12px] font-medium">چطور کار می‌کند؟</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-6 max-w-xl">
                  هر ردیف یک فضای کاری است: `business_members` + `user_roles`. JWT شامل memberships است. 
                  می‌توانید از هدر هر داشبورد سریع سوییچ کنید. آخرین انتخاب ذخیره می‌شود.
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-[11px] shrink-0" onClick={()=>router.push('/me')}>
              رفتن به پروفایل
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground mt-8">
          نکته: برای تجربه Slack-like، از سوییچر در هدر استفاده کن ⌘+K به زودی...
        </p>
      </div>
    </div>
  );
}
