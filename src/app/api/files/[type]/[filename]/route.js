import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

const MIME_MAP = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export async function GET(request, { params }) {
  try {
    const { type, filename } = await params;

    if (!type || !filename) {
      return NextResponse.json({ ok: false, error: 'type and filename required' }, { status: 400 });
    }

    // Security: prevent path traversal
    const safeType = String(type).replace(/[^a-zA-Z0-9-_]/g, '');
    const safeFile = path.basename(String(filename));

    if (!safeType || !safeFile) {
      return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_ROOT, safeType, safeFile);

    // Ensure file is inside upload root
    if (!filePath.startsWith(UPLOAD_ROOT)) {
      return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      console.warn('[api/files] not found', filePath);
      return NextResponse.json({ ok: false, error: 'File not found', path: filePath }, { status: 404 });
    }

    const ext = path.extname(safeFile).toLowerCase();
    const mime = MIME_MAP[ext] || 'application/octet-stream';
    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[api/files] error', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
