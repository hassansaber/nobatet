'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export function PayResultClient() {
  const sp = useSearchParams();
  const status = sp.get('status');
  const bookingId = sp.get('bookingId');
  const message = sp.get('message');
  const success = status === 'success';

  return (
    <Card className="w-full max-w-md text-center glass-strong">
      <CardHeader>
        <div className="mx-auto size-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: success ? '#ecfdf5' : '#fef2f2' }}>
          {success ? <CheckCircle className="size-8 text-green-600" /> : <XCircle className="size-8 text-red-600" />}
        </div>
        <CardTitle className="font-lalezar text-[18px] tracking-tight">
          {success ? 'پرداخت و رزرو قطعی شد' : 'پرداخت ناموفق'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <p className="text-[13px] text-muted-foreground leading-6">
            نوبت شما ثبت و تأیید شد
            {bookingId ? (
              <>
                {' '}
                · کد:{' '}
                <span dir="ltr" className="font-mono text-foreground font-medium">
                  {bookingId.slice(0, 8)}
                </span>
              </>
            ) : null}
            <br />
            <span className="text-[11px]">می‌توانید جزئیات را در داشبورد ببینید</span>
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground leading-6">
            {message || 'تراکنش تکمیل نشد. تایم آزاد شد؛ دوباره تلاش کنید.'}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link href="/me" className="w-full">
            <Button className="w-full h-11 gap-1.5">
              {success ? (
                <>
                  برو به داشبورد من
                  <ArrowLeft className="size-4" />
                </>
              ) : (
                'بازگشت به داشبورد'
              )}
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full h-10 text-[12px]">
              صفحه اصلی
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
