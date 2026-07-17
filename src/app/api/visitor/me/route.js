import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  ensureVisitorProfile,
  getVisitorStats,
  updateVisitorProfile,
} from '@/services/saas-service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const isVisitor = session.globalRoles?.includes('visitor') || session.role === 'visitor';
    const isSuper = session.globalRoles?.includes('super_admin') || session.role === 'super_admin';
    if (!isVisitor && !isSuper) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const ensured = await ensureVisitorProfile(session.sub);
    if (!ensured.ok) {
      return NextResponse.json(ensured, { status: 400 });
    }

    const stats = await getVisitorStats(ensured.visitor.id);
    return NextResponse.json({
      ok: true,
      visitor: ensured.visitor,
      stats,
    });
  } catch (err) {
    console.error('[api/visitor/me GET]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    await ensureVisitorProfile(session.sub);
    const result = await updateVisitorProfile(session.sub, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/visitor/me PATCH]', err);
    return NextResponse.json({ ok: false, error: 'خطای سرور' }, { status: 500 });
  }
}
