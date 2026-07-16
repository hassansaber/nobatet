import { NextResponse } from 'next/server';
import { requireBusinessSession } from '@/lib/api-auth';
import { db } from '@/db';
import { expenses } from '@/db/schema/saas';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(2).max(160),
  amount: z.number().min(0),
  category: z.enum(['rent', 'salary', 'purchase', 'marketing', 'bills', 'other']).default('other'),
  description: z.string().max(500).optional().nullable(),
  expenseDate: z.string().optional().nullable(),
});

export async function GET(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const days = Number(url.searchParams.get('days') || 30);

    const from = new Date();
    from.setDate(from.getDate() - days);

    const rows = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.businessId, auth.businessId), sql`${expenses.expenseDate} >= ${from}`))
      .orderBy(desc(expenses.expenseDate))
      .limit(100);

    const total = rows.reduce((s, r) => s + (r.amount || 0), 0);

    const byCategory = {};
    rows.forEach((r) => { byCategory[r.category] = (byCategory[r.category] || 0) + r.amount; });

    return NextResponse.json({ ok: true, expenses: rows, summary: { total, count: rows.length, byCategory } });
  } catch (err) {
    console.error('[expenses GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;
    const body = await request.json();
    const parsed = createSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const [row] = await db
      .insert(expenses)
      .values({
        businessId: auth.businessId,
        title: parsed.data.title,
        amount: parsed.data.amount,
        category: parsed.data.category,
        description: parsed.data.description || null,
        expenseDate: parsed.data.expenseDate ? new Date(parsed.data.expenseDate) : new Date(),
        createdBy: auth.userId,
      })
      .returning();
    return NextResponse.json({ ok: true, expense: row });
  } catch (err) {
    console.error('[expenses POST]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireBusinessSession(request);
    if (auth.error) return auth.error;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id الزامی' }, { status: 400 });
    const [deleted] = await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.businessId, auth.businessId))).returning();
    if (!deleted) return NextResponse.json({ ok: false, error: 'یافت نشد' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error('[expenses DELETE]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
