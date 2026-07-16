'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function PayResultClient() {
  const sp = useSearchParams();
  const status = sp.get('status');
  const bookingId = sp.get('bookingId');
  const message = sp.get('message');
  const success = status === 'success';

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="text-4xl mb-2">{success ? '✅' : '❌'}</div>
        <CardTitle>
          {success ? 'پرداخت و رزرو قطعی شد' : 'پرداخت ناموفق'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <p className="text-sm text-muted-foreground">
            نوبت شما ثبت شد
            {bookingId ? (
              <>
                {' '}
                · کد:{' '}
                <span dir="ltr" className="font-mono text-foreground">
                  {bookingId.slice(0, 8)}
                </span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {message || 'تراکنش تکمیل نشد. تایم آزاد شد؛ دوباره تلاش کنید.'}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link href="/">
            <Button className="w-full" variant={success ? 'primary' : 'secondary'}>
              بازگشت به نوبتت
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
