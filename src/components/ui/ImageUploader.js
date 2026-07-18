'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Plus, Image as ImageIcon } from 'lucide-react';

const MAX_GALLERY = 10;

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

export function GalleryUploader({ values = [], onChange, type = 'gallery', max = MAX_GALLERY }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const remaining = max - values.length;
  const isFull = values.length >= max;

  async function handleFiles(files) {
    if (isFull) {
      setError(`گالری حداکثر ${max} آیتم می‌تواند داشته باشد`);
      return;
    }
    // فقط به اندازه باقی‌مانده قبول کن
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`فقط ${remaining} فایل دیگر می‌توانید اضافه کنید (حداکثر ${max})`);
    } else {
      setError('');
    }

    setUploading(true);
    const newUrls = [];
    const errors = [];
    for (const file of toUpload) {
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
    if (newUrls.length) {
      const combined = [...values, ...newUrls].slice(0, max);
      onChange?.(combined);
    }
    if (errors.length) {
      setError('برخی فایل‌ها آپلود نشد: ' + errors.join(' | '));
    }
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {values.map((url, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border aspect-[4/3] bg-slate-50">
            {url.match(/\.(mp4|webm)$/i) ? <video src={url} className="w-full h-full object-cover" controls playsInline preload="metadata" /> : <img src={url} alt={`gallery ${idx}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
            <button type="button" onClick={() => onChange?.(values.filter((_, i) => i !== idx))} className="absolute top-1 right-1 size-7 rounded-full bg-red-600 text-white text-xs opacity-90 hover:bg-red-700 flex items-center justify-center">×</button>
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">{idx+1}/{max}</span>
          </div>
        ))}
        {values.length === 0 && (
          <div className="col-span-2 sm:col-span-3 rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-6 text-center">
            <ImageIcon className="size-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-[11px] text-muted-foreground">هنوز عکسی نیست — تا {max} عکس/ویدیو می‌توانید آپلود کنید</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={(e) => { if (e.target.files?.length) handleFiles(Array.from(e.target.files)); e.target.value = ''; }} className="hidden" />
        <Button type="button" size="sm" loading={uploading} disabled={isFull} onClick={() => inputRef.current?.click()} className="gap-1.5">
          <Plus className="size-3.5" />
          {isFull ? `حداکثر ${max} تکمیل شد` : 'افزودن تصویر/ویدیو'}
        </Button>
        <span className={`text-[11px] self-center px-2 py-1 rounded-full border ${isFull ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-border text-muted-foreground'}`}>
          {values.length}/{max} آیتم {isFull ? '• پر شده' : `• ${remaining} باقی‌مانده`} • بهینه‌سازی خودکار
        </span>
      </div>
      {error && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">{error}</p>}
      {isFull && <p className="text-[11px] text-muted-foreground">برای افزودن جدید، ابتدا یکی را حذف کنید. سقف گالری {max} است.</p>}
    </div>
  );
}
