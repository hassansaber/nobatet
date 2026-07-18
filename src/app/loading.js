export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F8FAFC] relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#E0F2FE_0%,_transparent_60%)]" />
      <div className="relative flex flex-col items-center">
        <div className="size-12 rounded-2xl bg-primary animate-pulse shadow-lg shadow-primary/20 flex items-center justify-center">
          <span className="font-lalezar text-white text-[18px]" style={{ fontFamily: 'var(--font-lalezar)' }}>ن</span>
        </div>
        <p className="mt-4 font-lalezar text-[13px] text-muted-foreground tracking-tight">در حال بارگذاری نوبتت...</p>
        <div className="mt-3 flex gap-1">
          <span className="size-1.5 rounded-full bg-primary animate-bounce" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}
