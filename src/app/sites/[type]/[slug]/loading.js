export default function Loading() {
  return (
    <div className="min-h-dvh bg-slate-50 animate-pulse">
      <div className="h-[300px] sm:h-[420px] w-full bg-slate-200" />
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="h-6 w-1/3 bg-slate-200 rounded-xl" />
        <div className="h-20 bg-white rounded-2xl border" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[4/3] bg-white rounded-2xl border" />
          <div className="aspect-[4/3] bg-white rounded-2xl border" />
        </div>
        <div className="h-40 bg-white rounded-2xl border" />
      </div>
    </div>
  );
}
