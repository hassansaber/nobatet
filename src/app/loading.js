export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50">
      <div className="size-12 rounded-2xl bg-primary animate-pulse shadow-lg shadow-teal-900/20" />
      <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse">در حال بارگذاری نوبتت...</p>
      <div className="mt-3 flex gap-1">
        <span className="size-1.5 rounded-full bg-primary animate-bounce" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}
