import { notFound } from 'next/navigation';
import { db } from '@/db';
import { businessInvites } from '@/db/schema/auth.js';
import { eq } from 'drizzle-orm';
import { InviteAcceptClient } from '@/components/business/InviteAcceptClient';

export async function generateMetadata({ params }) {
  return { title: 'دعوت به تیم' };
}

export default async function InvitePage({ params }) {
  const { token } = await params;
  if (!token) notFound();

  const [invite] = await db.select().from(businessInvites).where(eq(businessInvites.token, token)).limit(1);
  if (!invite) notFound();
  if (invite.isAccepted) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border p-6 text-center">
          <h1 className="font-black">این دعوت قبلا استفاده شده</h1>
          <p className="text-sm text-muted-foreground mt-2">این لینک دعوت قبلا پذیرفته شده است.</p>
          <a href="/login" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-white text-sm">ورود</a>
        </div>
      </div>
    );
  }
  if (new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border p-6 text-center">
          <h1 className="font-black">دعوت منقضی شده</h1>
          <p className="text-sm text-muted-foreground mt-2">این لینک بعد از ۷ روز منقضی شده - از مدیر بخواه دوباره دعوت کند.</p>
        </div>
      </div>
    );
  }

  return <InviteAcceptClient token={token} invite={invite} />;
}
