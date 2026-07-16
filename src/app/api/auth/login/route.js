import { NextResponse } from 'next/server';
import { passwordLoginSchema } from '@/lib/validators';
import { loginWithPassword } from '@/services/auth-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = passwordLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message || 'داده نامعتبر',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await loginWithPassword(
      parsed.data.phone,
      parsed.data.password,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/auth/login]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور. لطفاً بعداً تلاش کنید' },
      { status: 500 },
    );
  }
}
