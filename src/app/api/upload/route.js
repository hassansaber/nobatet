import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'image/avif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg'];

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[upload] created dir', dir);
    }
  } catch (e) {
    console.error('[upload] ensureDir failed', dir, e?.message);
    throw e;
  }
}

async function tryLoadSharp() {
  try {
    // try commonjs require first (works in nodejs runtime)
    // eslint-disable-next-line
    const sharp = require('sharp');
    return sharp;
  } catch {}
  try {
    const mod = await import('sharp');
    return mod.default || mod;
  } catch (e) {
    console.warn('[upload] sharp not available', e?.message);
    return null;
  }
}

async function optimizeImage(buffer, mime, type) {
  const sharp = await tryLoadSharp();
  if (!sharp) {
    console.warn('[upload] sharp unavailable, using original');
    return { buffer, ext: mime.split('/')[1] || 'jpg', mime };
  }

  try {
    let pipeline = sharp(buffer).rotate();

    const configs = {
      avatar: { w: 400, h: 400, fit: 'cover' },
      logo: { w: 512, h: 512, fit: 'contain', bg: { r: 255, g: 255, b: 255, alpha: 0 } },
      banner: { w: 1280, h: 720, fit: 'cover' },
      gallery: { w: 1024, h: 768, fit: 'inside' },
      staff: { w: 400, h: 400, fit: 'cover' },
      general: { w: 1024, h: 1024, fit: 'inside' },
      video: { w: 1280, h: 720, fit: 'inside' },
    };
    const cfg = configs[type] || configs.general;

    if (cfg.fit === 'cover') {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'cover', position: 'center' });
    } else if (cfg.fit === 'contain') {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'contain', background: cfg.bg || { r: 255, g: 255, b: 255, alpha: 0 } });
    } else {
      pipeline = pipeline.resize(cfg.w, cfg.h, { fit: 'inside', withoutEnlargement: true });
    }

    const optimized = await pipeline.webp({ quality: 82 }).toBuffer();
    return { buffer: optimized, ext: 'webp', mime: 'image/webp' };
  } catch (e) {
    console.warn('[upload] sharp optimization failed', e?.message);
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
    const typeRaw = formData.get('type');
    const type = (typeof typeRaw === 'string' ? typeRaw : 'general').toLowerCase();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: 'فایلی ارسال نشده' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type || 'application/octet-stream';
    const isImage = ALLOWED_IMAGE.includes(mime) || mime.startsWith('image/');
    const isVideo = ALLOWED_VIDEO.includes(mime) || mime.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json({ ok: false, error: `فرمت غیرمجاز: ${mime}` }, { status: 400 });
    }

    if (isImage && buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: 'حجم تصویر بیش از ۱۰ مگابایت است' }, { status: 400 });
    }
    if (isVideo && buffer.length > MAX_VIDEO_SIZE) {
      return NextResponse.json({ ok: false, error: 'حجم ویدیو بیش از ۵۰ مگابایت است' }, { status: 400 });
    }

    // Ensure dirs
    ensureDir(UPLOAD_ROOT);
    const allowedTypes = ['avatar', 'logo', 'banner', 'gallery', 'staff', 'video', 'general'];
    const safeType = allowedTypes.includes(type) ? type : 'general';
    const subDir = path.join(UPLOAD_ROOT, safeType);
    ensureDir(subDir);

    const originalName = file.name || 'upload';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const safeBase = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 30) || 'file';
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);

    let finalBuffer = buffer;
    let ext = path.extname(originalName).replace('.', '').toLowerCase() || (isImage ? 'jpg' : 'mp4');
    let finalMime = mime;

    if (isImage) {
      const optimized = await optimizeImage(buffer, mime, safeType);
      finalBuffer = optimized.buffer;
      ext = optimized.ext;
      finalMime = optimized.mime;
    }

    const fileName = `${safeBase}-${timestamp}-${rand}.${ext}`;
    const filePath = path.join(subDir, fileName);

    fs.writeFileSync(filePath, finalBuffer);

    // Verify
    if (!fs.existsSync(filePath)) {
      throw new Error('File write verification failed');
    }

    const publicUrl = `/uploads/${safeType}/${fileName}`;
    const apiUrl = `/api/files/${safeType}/${fileName}`;

    console.log(`[upload] success ${publicUrl} (${finalBuffer.length} bytes) -> ${filePath}`);

    return NextResponse.json({
      ok: true,
      url: apiUrl, // استفاده از API برای نمایش مطمئن (bypass static + SW)
      publicUrl: publicUrl, // URL استاتیک برای ذخیره در DB (هم روی هاست دیده می‌شود)
      fileName,
      size: finalBuffer.length,
      mime: finalMime,
      type: safeType,
      message: 'آپلود موفق و بهینه‌سازی شد',
    });
  } catch (err) {
    console.error('[api/upload] error', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور در آپلود: ' + (err?.message || 'نامشخص') }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureDir(UPLOAD_ROOT);
    const result = {};
    const diagnostics = {
      cwd: process.cwd(),
      uploadRoot: UPLOAD_ROOT,
      exists: fs.existsSync(UPLOAD_ROOT),
      writable: false,
      sharpAvailable: false,
      files: {},
    };

    // Test writability
    try {
      const testPath = path.join(UPLOAD_ROOT, '.writetest');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      diagnostics.writable = true;
    } catch (e) {
      diagnostics.writable = false;
      diagnostics.writeError = e?.message;
    }

    // Test sharp
    const sharp = await tryLoadSharp();
    diagnostics.sharpAvailable = !!sharp;

    const types = fs.readdirSync(UPLOAD_ROOT);
    for (const t of types) {
      const p = path.join(UPLOAD_ROOT, t);
      try {
        if (fs.statSync(p).isDirectory()) {
          const files = fs.readdirSync(p).slice(0, 50);
          result[t] = {
            count: fs.readdirSync(p).length,
            sample: files.map((f) => `/uploads/${t}/${f}`),
          };
        }
      } catch {}
    }

    return NextResponse.json({ ok: true, uploads: result, diagnostics });
  } catch (e) {
    console.error('[upload GET]', e);
    return NextResponse.json({ ok: false, error: e?.message, stack: e?.stack?.slice(0,500) }, { status: 500 });
  }
}
