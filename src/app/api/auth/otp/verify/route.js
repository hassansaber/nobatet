import { NextResponse } from 'next/server';
import { verifyOtpSchema } from '@/lib/validators';
import { verifyOtp } from '@/services/auth-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

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

    const result = await verifyOtp(
      parsed.data.phone,
      parsed.data.code,
      parsed.data.purpose,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/auth/otp/verify]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور. لطفاً بعداً تلاش کنید' },
      { status: 500 },
    );
  }
}
