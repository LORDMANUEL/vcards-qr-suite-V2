import { NextResponse } from 'next/server';
import { expirePortalSessions } from '@/lib/captive';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const expiredCount = await expirePortalSessions();
    return NextResponse.json({ success: true, expiredCount });
  } catch (error) {
    console.error('Error expiring portal sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
