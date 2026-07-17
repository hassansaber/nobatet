'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function BarChart({ data, maxValue, labelKey = 'label', valueKey = 'value', color = '#0284C7' }) {
  const max = maxValue || Math.max(1, ...data.map((d) => d[valueKey]));
  const [hidden, setHidden] = useState(new Set());
  const [tooltip, setTooltip] = useState(null);

  const visibleData = data.filter((_, i) => !hidden.has(i));

  return (
    <div className="space-y-3">
      {/* Legend interactive */}
      <div className="flex flex-wrap gap-2">
        {data.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              const next = new Set(hidden);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              setHidden(next);
            }}
            aria-pressed={hidden.has(i)}
            aria-label={`Toggle ${item[labelKey]}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
              hidden.has(i) ? 'opacity-40 bg-muted border-border' : 'bg-white border-border hover:border-primary/30',
            )}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color || color }} aria-hidden />
            {item[labelKey]}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {data.map((item, i) => {
          if (hidden.has(i)) return null;
          const pct = Math.round((item[valueKey] / max) * 100);
          return (
            <div key={i} className="space-y-1 group">
              <div className="flex justify-between text-[11px]">
                <span className="font-medium truncate">{item[labelKey]}</span>
                <span className="font-bold tabular-nums">{item[valueKey]}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out hover:brightness-110 cursor-pointer"
                  style={{ width: `${pct}%`, backgroundColor: item.color || color }}
                  role="progressbar"
                  aria-valuenow={item[valueKey]}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-label={`${item[labelKey]}: ${item[valueKey]}`}
                  tabIndex={0}
                  onMouseEnter={() => setTooltip({ i, label: item[labelKey], value: item[valueKey] })}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={() => setTooltip({ i, label: item[labelKey], value: item[valueKey] })}
                  onBlur={() => setTooltip(null)}
                />
                {tooltip?.i === i && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap z-10">
                    {tooltip.label}: {tooltip.value}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {visibleData.length === 0 && <p className="text-[11px] text-muted-foreground">همه سری‌ها مخفی شدند — روی لگند کلیک کنید</p>}
    </div>
  );
}

export function DonutChart({ data, size = 120 }) {
  let acc = 0;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const [active, setActive] = useState(null);

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`نمودار دونات، مجموع ${total}`}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} fill="none" stroke="#EFF7FB" strokeWidth="16" />
          {data.map((seg, i) => {
            const val = seg.value;
            const perc = val / total;
            const dash = perc * (2 * Math.PI * (size / 2 - 8));
            const gap = 2 * Math.PI * (size / 2 - 8) - dash;
            const rotate = (acc / total) * 360;
            acc += val;
            const isActive = active === i;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 8}
                fill="none"
                stroke={seg.color || '#0284C7'}
                strokeWidth={isActive ? 20 : 16}
                strokeDasharray={`${dash} ${gap}`}
                transform={`rotate(${rotate - 90} ${size / 2} ${size / 2})`}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer focus-visible:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${seg.label}: ${seg.value}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            );
          })}
          <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" className="font-black text-[14px] fill-slate-900 tabular-nums">{total}</text>
          {active !== null && <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" className="text-[10px] fill-muted-foreground">{data[active]?.label}</text>}
        </svg>
      </div>
      <div className="space-y-1.5 flex-1">
        {data.map((d, i) => (
          <button
            key={i}
            onClick={() => setActive(active === i ? null : i)}
            className={cn(
              'w-full flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-colors cursor-pointer text-right',
              active === i ? 'bg-slate-50 border border-border' : 'hover:bg-slate-50 border border-transparent',
            )}
          >
            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || '#0284C7' }} aria-hidden />
            <span className="flex-1 truncate text-left">{d.label}</span>
            <span className="font-bold tabular-nums">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, color = '#0284C7', height = 100 }) {
  if (!data.length) return <p className="text-xs text-muted-foreground">داده‌ای نیست</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const [hoverIdx, setHoverIdx] = useState(null);

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <div className="relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="نمودار خطی">
          <polyline fill="none" stroke={color} strokeWidth="2" points={points} className="drop-shadow-sm" />
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = 100 - ((d.value - min) / (max - min || 1)) * 100;
            const isHover = hoverIdx === i;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHover ? 3 : 1.8}
                  fill={color}
                  className="transition-all cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: ${d.value}`}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(i)}
                  onBlur={() => setHoverIdx(null)}
                />
                {isHover && (
                  <g>
                    <rect x={x > 70 ? x - 18 : x + 1} y={y - 10} width="16" height="8" rx="2" fill="#0F172A" />
                    <text x={x > 70 ? x - 10 : x + 9} y={y - 5} textAnchor="middle" fontSize="3.5" fill="white" className="font-bold tabular-nums">{d.value}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        {data.map((d, i) => (i % Math.ceil(data.length / 6) === 0 ? <span key={i} className="tabular-nums">{d.label}</span> : <span key={i} />))}
      </div>
      <p className="sr-only">نمودار خطی با {data.length} نقطه، بیشینه {max}، کمینه {min}</p>
    </div>
  );
}

export function StatCard({ label, value, hint, trend, color }) {
  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur px-3 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
      <p className="text-[15px] font-black mt-1 tabular-nums group-hover:scale-[1.02] transition-transform" style={{ color: color || undefined }}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      {trend && <p className={cn('text-[10px] mt-1 font-bold tabular-nums', trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground')}>{trend}</p>}
    </div>
  );
}
