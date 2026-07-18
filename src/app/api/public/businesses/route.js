import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema/businesses';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        city: businesses.city,
        logoUrl: businesses.logoUrl,
        bannerUrl: businesses.bannerUrl,
        phone: businesses.phone,
      })
      .from(businesses)
      .where(eq(businesses.isActive, true))
      .orderBy(desc(businesses.createdAt))
      .limit(24);

    return NextResponse.json({ ok: true, businesses: rows });
  } catch (err) {
    console.error('[api/public/businesses list]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
