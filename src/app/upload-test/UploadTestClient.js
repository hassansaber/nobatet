'use client';

import { useEffect, useState } from 'react';
import { ImageUploader, GalleryUploader } from '@/components/ui/ImageUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function UploadTestPage() {
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDiag() {
    setLoading(true);
    try {
      const res = await fetch('/api/upload', { credentials: 'include' });
      const data = await res.json();
      setDiagnostics(data);
    } catch (e) {
      setDiagnostics({ ok: false, error: e.message });
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDiag(); }, []);

  return (
    <div className="min-h-dvh bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-black">تست آپلود — دیباگ</h1>
        <p className="text-sm text-muted-foreground">این صفحه برای تست آپلود روی Docker Desktop ساخته شده. اگر فایلی آپلود کردی باید توی <code>public/uploads/</code> روی هاست (چون bind mount کردیم) ظاهر بشه.</p>

        <Card>
          <CardHeader><CardTitle className="text-sm">وضعیت پوشه آپلود (GET /api/upload)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-xs">در حال بارگذاری...</p> : <pre className="text-[11px] bg-slate-900 text-green-400 p-3 rounded-xl overflow-auto max-h-[300px]" dir="ltr">{JSON.stringify(diagnostics, null, 2)}</pre>}
            <button onClick={loadDiag} className="mt-3 h-8 px-3 rounded-lg border bg-white text-xs font-bold">🔄 رفرش وضعیت</button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">تست آپلود تک فایل (logo)</CardTitle></CardHeader>
          <CardContent>
            <ImageUploader label="لوگو تستی" value={logo} onChange={setLogo} type="logo" />
            {logo && <p className="text-xs mt-2">URL: <code dir="ltr">{logo}</code></p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">تست گالری چندتایی</CardTitle></CardHeader>
          <CardContent>
            <GalleryUploader values={gallery} onChange={setGallery} type="gallery" />
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-sm">راهنمای عیب‌یابی Docker Desktop</CardTitle></CardHeader>
          <CardContent className="text-xs leading-7 space-y-2">
            <p><strong>۱. آیا وارد شده‌ای؟</strong> آپلود نیاز به لاگین دارد (getSession). اول با حساب Owner لاگین کن: 09120000001 / 123456</p>
            <p><strong>۲. تب Network:</strong> بعد از انتخاب فایل، تب Network مرورگر (F12) → فیلتر `/api/upload` → روی درخواست کلیک کن → Preview/Response را کپی کن و برای من بفرست.</p>
            <p><strong>۳. پوشه روی هاست:</strong> چون در `docker-compose.yml` حالا `volumes: - ./public/uploads:/app/public/uploads` داریم، فایل‌ها باید روی هاست تو `nobatet/public/uploads/{type}/` ظاهر شوند. اگر خالیه، یعنی یا 401 بوده یا کانتینر ری‌استارت شده بدون volume (ولی الان bind mount هست).</p>
            <p><strong>۴. لاگ کانتینر:</strong> در Docker Desktop → Container nobatet-app → Logs → باید `[upload]` لاگ ببینی. اگر می‌بینی `sharp not available` مشکلی نیست - fallback به فایل اصلی.</p>
            <p><strong>۵. مجوز:</strong> entrypoint حالا `chmod 775` و `chown nextjs` می‌کند. اگر باز هم خطای permission بود، تب Network ارور `EACCES` نشان می‌دهد.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">برای من چه بفرستی؟</CardTitle></CardHeader>
          <CardContent className="text-xs leading-6">
            <ol className="list-decimal pr-5 space-y-1">
              <li>اسکرین‌شات تب Network → درخواست POST /api/upload → بخش Headers و Response</li>
              <li>خروجی GET /api/upload (همین بالا) — قسمت diagnostics.writable و sharpAvailable</li>
              <li>لاگ کانتینر nobatet-app از Docker Desktop (آخرین 20 خط)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
