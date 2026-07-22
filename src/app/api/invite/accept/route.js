import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { businessInvites } from '@/db/schema/auth.js';
import { businessMembers } from '@/db/schema/businesses';
import { getSession } from '@/lib/auth';
import { incrementTokenVersion } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 });

    const { token } = await request.json();
    if (!token) return NextResponse.json({ ok: false, error: 'token الزامی' }, { status: 400 });

    const [invite] = await db.select().from(businessInvites).where(eq(businessInvites.token, token)).limit(1);
    if (!invite) return NextResponse.json({ ok: false, error: 'دعوت یافت نشد' }, { status: 404 });
    if (invite.isAccepted) return NextResponse.json({ ok: false, error: 'قبلا پذیرفته شده' }, { status: 400 });
    if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ ok: false, error: 'منقضی شده' }, { status: 400 });

    // چک ساده عضویت
    const { and } = await import('drizzle-orm');
    const [memberExists] = await db.select().from(businessMembers).where(and(eq(businessMembers.businessId, invite.businessId), eq(businessMembers.userId, session.sub))).limit(1);
    if (memberExists) {
      if (!memberExists.isActive) {
        await db.update(businessMembers).set({ isActive: true, role: invite.role }).where(eq(businessMembers.id, memberExists.id));
      }
    } else {
      await db.insert(businessMembers).values({
        businessId: invite.businessId,
        userId: session.sub,
        role: invite.role,
      });
    }

    await db.update(businessInvites).set({ isAccepted: true }).where(eq(businessInvites.id, invite.id));
    await incrementTokenVersion(session.sub);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[invite/accept]', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
