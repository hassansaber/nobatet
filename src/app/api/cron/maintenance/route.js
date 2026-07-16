import { NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { expireStaleLocks } from '@/services/booking-engine';
import { db } from '@/db';
import { bookings } from '@/db/schema/bookings';
import { businesses } from '@/db/schema/businesses';
import { sendSms } from '@/services/sms';

/**
 * Cron نگهداری:
 * - انقضای قفل‌های پرداخت
 * - یادآوری ۲۴س و ۲س (اگر bodyId تنظیم شده باشد)
 *
 * Authorization: header x-cron-secret یا ?secret=
 * روی Liara می‌توانید با Cron Job این endpoint را بزنید.
 */
export async function POST(request) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const expired = await expireStaleLocks();

    const reminders = { h24: 0, h2: 0, errors: [] };
    const now = Date.now();

    // پنجره ۲۴ ساعت (±۱۵ دقیقه)
    reminders.h24 = await sendRemindersInWindow(
      now + 24 * 60 * 60 * 1000,
      15,
      'reminder_24h',
      reminders.errors,
    );

    // پنجره ۲ ساعت
    reminders.h2 = await sendRemindersInWindow(
      now + 2 * 60 * 60 * 1000,
      15,
      'reminder_2h',
      reminders.errors,
    );

    return NextResponse.json({
      ok: true,
      expired,
      reminders,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[api/cron/maintenance]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function GET(request) {
  return POST(request);
}

function authorize(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('x-cron-secret');
  const query = new URL(request.url).searchParams.get('secret');
  return header === secret || query === secret;
}

/**
 * @param {number} centerMs
 * @param {number} windowMinutes
 * @param {'reminder_24h' | 'reminder_2h'} pattern
 * @param {string[]} errors
 */
async function sendRemindersInWindow(centerMs, windowMinutes, pattern, errors) {
  const from = new Date(centerMs - windowMinutes * 60_000);
  const to = new Date(centerMs + windowMinutes * 60_000);

  const rows = await db
    .select({
      id: bookings.id,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      startsAt: bookings.startsAt,
      businessName: businesses.name,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .where(
      and(
        eq(bookings.status, 'confirmed'),
        gte(bookings.startsAt, from),
        lte(bookings.startsAt, to),
      ),
    );

  let sent = 0;
  for (const row of rows) {
    const timeFa = new Date(row.startsAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const result = await sendSms(row.customerPhone, pattern, [
      row.customerName,
      timeFa,
      row.businessName,
    ]);
    if (result.success) sent += 1;
    else errors.push(`${pattern}:${row.id}:${result.error}`);
  }
  return sent;
}
