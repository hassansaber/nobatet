import { NextResponse } from 'next/server';
import { completeSandboxGatewayPayment } from '@/services/payment';

/**
 * Callback درگاه sandbox (از صفحه /pay/sandbox فراخوانی می‌شود)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { paymentId, authority, success } = body;

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: 'paymentId الزامی است' },
        { status: 400 },
      );
    }

    const result = await completeSandboxGatewayPayment({
      paymentId,
      authority: authority || '',
      success: Boolean(success),
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
    });
  } catch (err) {
    console.error('[api/public/payments/sandbox/callback]', err);
    return NextResponse.json(
      { ok: false, error: 'خطای سرور' },
      { status: 500 },
    );
  }
}
