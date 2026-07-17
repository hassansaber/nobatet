import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[radial-gradient(ellipse_at_top,_#ccfbf1_0%,_#f8fafc_50%)]">
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-white font-black text-sm">
            ن
          </span>
          <span className="text-lg font-black">نوبتت</span>
        </Link>
      </div>
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10 pt-4">
        {children}
      </div>
    </div>
  );
}
