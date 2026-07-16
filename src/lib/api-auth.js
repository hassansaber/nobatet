import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  assertBusinessAccess,
  resolveBusinessId,
} from '@/services/business-service';

/**
 * احراز هویت + resolve business برای APIهای پنل owner
 * @param {Request} request
 * @param {{ roles?: string[] | null, businessId?: string | null }} opts
 */
export async function requireBusinessSession(request, opts = {}) {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const url = new URL(request.url);
  let businessId =
    opts.businessId ||
    url.searchParams.get('businessId') ||
    null;

  // body may have businessId for POST — caller can pass
  if (!businessId) {
    businessId = await resolveBusinessId(session.sub, null);
  }

  if (!businessId) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'بیزنسی یافت نشد' },
        { status: 404 },
      ),
    };
  }

  if (session.role !== 'super_admin') {
    const access = await assertBusinessAccess(
      businessId,
      session.sub,
      opts.roles || null,
    );
    if (!access) {
      return {
        error: NextResponse.json(
          { ok: false, error: 'دسترسی ندارید' },
          { status: 403 },
        ),
      };
    }
  }

  return { session, businessId };
}
