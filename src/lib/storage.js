/**
 * Storage abstraction برای آپلود
 * فعلی: local filesystem (public/uploads)
 * آینده: S3 / Liara Object Storage
 * 
 * برای مقیاس‌پذیری، خارجی‌ها مثل Fresha از S3 + CloudFront استفاده می‌کنند
 * این فایل یک abstraction layer است تا بعداً بدون تغییر API بتوان S3 را جایگزین کرد
 */

import fs from 'fs/promises';
import path from 'path';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

// اطمینان از وجود پوشه
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

/**
 * ذخیره فایل
 * @param {Buffer} buffer
 * @param {string} type - avatar, logo, banner, gallery, etc.
 * @param {string} filename
 * @returns {string} public URL path
 */
export async function saveFile(buffer, type, filename) {
  const storageDriver = process.env.STORAGE_DRIVER || 'local'; // local | s3

  if (storageDriver === 's3') {
    // TODO: پیاده‌سازی S3
    // const s3 = new S3Client(...)
    // await s3.send(new PutObjectCommand({...}))
    // return `https://${bucket}.s3.ir-thr-at1.arvanstorage.ir/${type}/${filename}`
    throw new Error('S3 driver not implemented yet - set STORAGE_DRIVER=local');
  }

  // local driver
  const dir = path.join(UPLOAD_ROOT, type);
  await ensureDir(dir);
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  // Return public URL
  return `/uploads/${type}/${filename}`;
}

/**
 * حذف فایل
 */
export async function deleteFile(publicUrl) {
  try {
    if (!publicUrl?.startsWith('/uploads/')) return;
    const fullPath = path.join(process.cwd(), 'public', publicUrl);
    await fs.unlink(fullPath);
  } catch {}
}

/**
 * چک وجود فایل
 */
export async function fileExists(publicUrl) {
  try {
    const fullPath = path.join(process.cwd(), 'public', publicUrl);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}
