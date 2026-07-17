'use client';

export function Skeleton({ className = '', width, height, rounded = 'xl' }) {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] ${rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : `rounded-${rounded}`} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
      <Skeleton width="60%" height={14} />
      <Skeleton width="100%" height={20} />
      <Skeleton width="80%" height={14} />
    </div>
  );
}

export function SkeletonChart({ height = 120 }) {
  return (
    <div className="space-y-3">
      <Skeleton width="30%" height={12} />
      <div className="flex items-end gap-1" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" height={20 + Math.random() * (height - 40)} rounded="t" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton width={40} height={40} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={10} />
          </div>
          <Skeleton width={60} height={28} rounded="xl" />
        </div>
      ))}
    </div>
  );
}
