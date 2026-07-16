import { NextResponse } from 'next/server';
import { sendOtpSchema } from '@/lib/validators';
import { requestOtp } from '@/services/auth-service';

/**
 * فقط POST — باز کردن URL در مرورگر (GET) باعث 405 می‌شود.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

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

    const result = await requestOtp(parsed.data.phone, parsed.data.purpose);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/auth/otp/request]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور. لطفاً بعداً تلاش کنید' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'این endpoint فقط POST می‌پذیرد. از فرم ورود/ثبت‌نام استفاده کنید (نه باز کردن مستقیم URL).',
      method: 'POST',
      body: { phone: '09123456789', purpose: 'login' },
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    },
  );
}
