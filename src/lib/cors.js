/**
 * CORS سخت‌گیرانه برای نوبتت
 * فقط دامنه‌های مجاز را قبول می‌کند، نه هر چیزی که شامل 'localhost' باشد
 */

function getBaseHost() {
  try {
    const raw = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3001';
    const host = raw.split('/')[0].split(':')[0].toLowerCase();
    return host || 'localhost';
  } catch {
    return 'localhost';
  }
}

function getAllowedOrigins() {
  const baseHost = getBaseHost();
  const isLocal = baseHost === 'localhost' || baseHost === '127.0.0.1' || baseHost.endsWith('.localhost') || baseHost === 'lvh.me' || baseHost.endsWith('.lvh.me');
  
  const origins = new Set();
  
  // همیشه لوکال مجاز برای dev
  origins.add('http://localhost:3001');
  origins.add('http://127.0.0.1:3001');
  origins.add('http://lvh.me:3001');
  
  // دامنه پایه
  const protocol = isLocal ? 'http' : 'https';
  origins.add(`${protocol}://${baseHost}`);
  if (baseHost.includes(':')) {
    origins.add(`${protocol}://${baseHost.split(':')[0]}:3001`);
  }
  
  // اگر پروداکشن است، *.nobatet.com را به صورت pattern چک می‌کنیم نه لیست ثابت
  // در تابع isOriginAllowed با regex چک می‌شود
  
  return origins;
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    const baseHost = getBaseHost();
    
    // لوکال ها
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'lvh.me') return true;
    if (hostname.endsWith('.localhost')) return true; // demo.localhost, moristyle.localhost
    if (hostname.endsWith('.lvh.me')) return true;
    
    // اگر بیس nobatet.com است
    if (baseHost === 'nobatet.com' || baseHost.endsWith('.nobatet.com')) {
      if (hostname === 'nobatet.com' || hostname.endsWith('.nobatet.com')) return true;
    }
    
    // اگر بیس دقیقاً برابر origin host باشد
    if (hostname === baseHost) return true;
    if (hostname.endsWith(`.${baseHost}`)) return true; // ساب‌دامین‌های بیس
    
    // لیست ثابت
    const allowed = getAllowedOrigins();
    if (allowed.has(origin)) return true;
    
    // در حالت dev، اجازه همه *.localhost:3001
    if (baseHost.includes('localhost')) {
      // هر چیزی که *.localhost:3001 باشد
      if (hostname.endsWith('localhost')) return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export function getCorsHeaders(request) {
  const origin = request?.headers?.get('origin') || '';
  const headers = { Vary: 'Origin' };
  
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

export function getCorsPreflightHeaders(request) {
  const origin = request?.headers?.get('origin') || '';
  const headers = { Vary: 'Origin' };
  
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    headers['Access-Control-Max-Age'] = '86400';
  }
  
  return headers;
}
