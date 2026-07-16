import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeIranPhone } from '@/lib/utils';
import { resetPassword } from '@/services/auth-service';

const schema = z.object({
  phone: z.string(),
  password: z.string().min(6).max(72),
  verificationToken: z.string().min(10),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'داده نامعتبر' },
        { status: 400 },
      );
    }

    const phone = normalizeIranPhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'شماره موبایل معتبر نیست' },
        { status: 400 },
      );
    }

    const result = await resetPassword({
      phone,
      password: parsed.data.password,
      verificationToken: parsed.data.verificationToken,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/auth/reset-password]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
