import { NextResponse } from 'next/server';
import { completeProfileSchema } from '@/lib/validators';
import { completeRegistration } from '@/services/auth-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = completeProfileSchema.safeParse(body);

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

    if (!body.verificationToken) {
      return NextResponse.json(
        { ok: false, error: 'توکن تأیید الزامی است' },
        { status: 400 },
      );
    }

    const result = await completeRegistration({
      ...parsed.data,
      verificationToken: body.verificationToken,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/auth/register]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور. لطفاً بعداً تلاش کنید' },
      { status: 500 },
    );
  }
}
