import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'nobatet',
    time: new Date().toISOString(),
  });
}
