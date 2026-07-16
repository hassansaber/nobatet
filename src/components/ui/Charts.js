'use client';

import { cn } from '@/lib/utils';

export function BarChart({ data, maxValue, labelKey = 'label', valueKey = 'value', color = '#0d9488' }) {
  const max = maxValue || Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-[11px]"><span className="font-medium">{item[labelKey]}</span><span className="font-bold">{item[valueKey]}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((item[valueKey] / max) * 100)}%`, backgroundColor: item.color || color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data, size = 120 }) {
  let acc = 0;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size/2} cy={size/2} r={size/2 - 8} fill="none" stroke="#f1f5f9" strokeWidth="16" />
        {data.map((seg, i) => {
          const val = seg.value;
          const perc = val / total;
          const dash = perc * (2 * Math.PI * (size/2 - 8));
          const gap = 2 * Math.PI * (size/2 - 8) - dash;
          const rotate = (acc / total) * 360;
          acc += val;
          return <circle key={i} cx={size/2} cy={size/2} r={size/2 - 8} fill="none" stroke={seg.color || '#0d9488'} strokeWidth="16" strokeDasharray={`${dash} ${gap}`} transform={`rotate(${rotate - 90} ${size/2} ${size/2})`} strokeLinecap="round" className="transition-all duration-700" />;
        })}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="font-black text-[14px] fill-slate-900">{total}</text>
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color || '#0d9488' }} />
            <span className="flex-1 truncate">{d.label}</span>
            <span className="font-bold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, color = '#0d9488', height = 100 }) {
  if (!data.length) return <p className="text-xs text-muted-foreground">داده‌ای نیست</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} className="drop-shadow-sm" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = 100 - ((d.value - min) / (max - min || 1)) * 100;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        {data.map((d, i) => (i % Math.ceil(data.length / 6) === 0 ? <span key={i}>{d.label}</span> : <span key={i} />))}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, trend, color }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color: color || undefined }}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      {trend && <p className={cn('text-[11px] mt-1 font-bold', trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground')}>{trend}</p>}
    </div>
  );
}

export function MiniArea({ data, color = '#0d9488' }) {
  return (
    <div className="h-12 w-full">
      <LineChart data={data} color={color} height={48} />
    </div>
  );
}
