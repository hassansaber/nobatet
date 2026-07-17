import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function optimizeImage(buffer, mime, type) {
  try {
    const sharp = (await import('sharp')).default;
    let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF

    // Different optimizations per type
    const configs = {
      avatar: { w: 400, h: 400, fit: 'cover' },
      logo: { w: 512, h: 512, fit: 'contain', bg: { r: 255, g: 255, b: 255, alpha: 0 } },
      banner: { w: 1280, h: 720, fit: 'cover' },
      gallery: { w: 1024, h: 768, fit: 'inside' },
      staff: { w: 400, h: 400, fit: 'cover' },
      general: { w: 1024, h: 1024, fit: 'inside' },
    };
    const cfg = configs[type] || configs.general;

    if (cfg.fit === 'cover') {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'cover', position: 'center' });
    } else if (cfg.fit === 'contain') {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'contain', background: cfg.bg || { r: 255, g: 255, b: 255, alpha: 0 } });
    } else {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'inside', withoutEnlargement: true });
    }

    // Convert to webp for better compression, but keep original mime for compatibility? We'll output webp
    const optimized = await pipeline.webp({ quality: 85 }).toBuffer();
    return { buffer: optimized, ext: 'webp', mime: 'image/webp' };
  } catch (e) {
    console.warn('[upload] sharp optimization failed, using original', e?.message);
    return { buffer, ext: mime.split('/')[1] || 'jpg', mime };
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const type = (formData.get('type') || 'general').toString(); // avatar, logo, banner, gallery, staff, video, general

    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: 'فایلی ارسال نشده' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type || 'application/octet-stream';
    const isImage = ALLOWED_IMAGE.includes(mime) || mime.startsWith('image/');
    const isVideo = ALLOWED_VIDEO.includes(mime) || mime.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json({ ok: false, error: `فرمت غیرمجاز: ${mime}. فقط تصویر و ویدیو مجاز است` }, { status: 400 });
    }

    if (isImage && buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: 'حجم تصویر بیش از ۱۰ مگابایت است' }, { status: 400 });
    }
    if (isVideo && buffer.length > MAX_VIDEO_SIZE) {
      return NextResponse.json({ ok: false, error: 'حجم ویدیو بیش از ۵۰ مگابایت است' }, { status: 400 });
    }

    ensureDir(UPLOAD_DIR);
    const subDir = path.join(UPLOAD_DIR, type);
    ensureDir(subDir);

    const originalName = file.name || 'upload';
    const safeBase = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '');
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);

    let finalBuffer = buffer;
    let ext = path.extname(originalName).replace('.', '') || (isImage ? 'jpg' : 'mp4');
    let finalMime = mime;

    if (isImage) {
      const optimized = await optimizeImage(buffer, mime, type);
      finalBuffer = optimized.buffer;
      ext = optimized.ext;
      finalMime = optimized.mime;
    }

    const fileName = `${safeBase}-${timestamp}-${rand}.${ext}`;
    const filePath = path.join(subDir, fileName);
    fs.writeFileSync(filePath, finalBuffer);

    // Also create thumbnail for gallery/banner? For now only one size optimized
    const publicUrl = `/uploads/${type}/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileName,
      size: finalBuffer.length,
      mime: finalMime,
      type,
      message: 'آپلود موفق و بهینه‌سازی شد',
    });
  } catch (err) {
    console.error('[api/upload]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور در آپلود: ' + (err?.message || '') }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 });
}
