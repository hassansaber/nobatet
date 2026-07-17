import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { db } from '@/db';
import { smsLogs } from '@/db/schema/saas';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const from30 = new Date(Date.now() - 30*24*60*60*1000);
    const fromMonthStart = new Date(); fromMonthStart.setDate(1); fromMonthStart.setHours(0,0,0,0);

    const all = await db.select({ c: sql`count(*)::int` }).from(smsLogs).where(eq(smsLogs.businessId, auth.businessId));
    const month = await db.select({ c: sql`count(*)::int` }).from(smsLogs).where(and(eq(smsLogs.businessId, auth.businessId), gte(smsLogs.createdAt, fromMonthStart)));
    const last30 = await db.select({ c: sql`count(*)::int` }).from(smsLogs).where(and(eq(smsLogs.businessId, auth.businessId), gte(smsLogs.createdAt, from30)));

    const byPattern = await db.select({ pattern: smsLogs.pattern, c: sql`count(*)::int` }).from(smsLogs).where(eq(smsLogs.businessId, auth.businessId)).groupBy(smsLogs.pattern);

    const recent = await db.select().from(smsLogs).where(eq(smsLogs.businessId, auth.businessId)).orderBy(sql`${smsLogs.createdAt} desc`).limit(20);

    return NextResponse.json({ ok: true, stats: { total: all[0]?.c||0, thisMonth: month[0]?.c||0, last30: last30[0]?.c||0, byPattern, recent } });
  } catch (err) {
    console.error('[sms-usage]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
