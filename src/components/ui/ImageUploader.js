'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Plus, Image as ImageIcon } from 'lucide-react';

export function ImageUploader({ label, value, onChange, type = 'general', accept = 'image/*,video/*', hint, preview = true }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(`در حال آپلود ${file.name} (${Math.round(file.size/1024)}KB)...`);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);

      const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { ok: false, error: `پاسخ نامعتبر: ${text.slice(0,200)}`, status: res.status }; }
      if (!data.ok) {
        setError(`خطا ${res.status}: ${data.error || 'آپلود ناموفق'}`);
        setProgress('');
        return;
      }
      onChange?.(data.url);
      setProgress(`✓ آپلود شد (${Math.round(data.size/1024)}KB)`);
      setTimeout(() => setProgress(''), 4000);
    } catch (e) {
      setError('خطای شبکه: ' + (e?.message || ''));
      setProgress('');
    } finally {
      setUploading(false);
    }
  }

  function onSelect(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isVideo = value && (value.endsWith('.mp4') || value.endsWith('.webm') || value.includes('/video') || value.includes('video'));

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium block">{label}</label>}
      
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-4 hover:border-primary/40 transition-colors"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <div className="flex gap-2 flex-wrap">
              <input ref={inputRef} type="file" accept={accept} onChange={onSelect} className="hidden" />
              <Button type="button" size="sm" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()} className="gap-1.5">
                <Upload className="size-3.5" />
                {uploading ? 'در حال آپلود...' : 'انتخاب فایل'}
              </Button>
              {value && (
                <Button type="button" size="sm" variant="ghost" onClick={() => onChange?.('')}>
                  پاک کردن
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-5">
              {hint || 'تصویر یا ویدیو را بکشید اینجا یا انتخاب کنید. به صورت خودکار بهینه می‌شود (WebP, 85% quality). حداکثر ۱۰MB تصویر، ۵۰MB ویدیو.'}
            </p>
            {progress && <p className="text-xs text-teal-700 mt-1 font-bold">{progress}</p>}
            {error && <p className="text-xs text-red-600 mt-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">{error}</p>}
            
            {/* Keep URL input as fallback */}
            <div className="mt-3">
              <label className="text-[11px] text-muted-foreground">یا URL مستقیم (اختیاری):</label>
              <input value={value || ''} onChange={(e) => onChange?.(e.target.value)} placeholder="https://... یا /uploads/..." className="mt-1 w-full rounded-lg border border-border p-2 text-xs" dir="ltr" />
            </div>
          </div>

          {preview && value && (
            <div className="shrink-0">
              <p className="text-[11px] text-muted-foreground mb-1">پیش‌نمایش:</p>
              <div className="size-24 rounded-xl overflow-hidden border bg-white shadow-sm">
                {isVideo ? (
                  <video src={value} className="w-full h-full object-cover" controls muted loop playsInline preload="metadata" />
                ) : (
                  <img src={value} alt="preview" loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GalleryUploader({ values = [], onChange, type = 'gallery' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFiles(files) {
    setUploading(true);
    const newUrls = [];
    const errors = [];
    for (const file of files) {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('type', type);
        const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { ok: false, error: `Invalid JSON: ${text.slice(0,100)}` }; }
        if (data.ok) newUrls.push(data.url);
        else errors.push(`${file.name}: ${data.error}`);
      } catch (e) {
        errors.push(`${file.name}: ${e.message}`);
      }
    }
    if (newUrls.length) onChange?.([...values, ...newUrls]);
    if (errors.length) alert('برخی فایل‌ها آپلود نشد:\n' + errors.join('\n') + '\n\nتب Network → /api/upload را چک کن');
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {values.map((url, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border aspect-[4/3] bg-slate-50">
            {url.match(/\.(mp4|webm)$/i) ? <video src={url} className="w-full h-full object-cover" controls playsInline preload="metadata" /> : <img src={url} alt={`gallery ${idx}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
            <button type="button" onClick={() => onChange?.(values.filter((_, i) => i !== idx))} className="absolute top-1 right-1 size-7 rounded-full bg-red-600 text-white text-xs opacity-90 hover:bg-red-700 flex items-center justify-center">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={(e) => { if (e.target.files?.length) handleFiles(Array.from(e.target.files)); e.target.value = ''; }} className="hidden" />
        <Button type="button" size="sm" loading={uploading} onClick={() => inputRef.current?.click()} className="gap-1.5">
          <Plus className="size-3.5" />
          افزودن تصویر/ویدیو
        </Button>
        <span className="text-[11px] text-muted-foreground self-center">{values.length} آیتم • آپلود چندتایی + بهینه‌سازی خودکار</span>
      </div>
    </div>
  );
}
