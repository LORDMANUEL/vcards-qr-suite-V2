import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revokePortalSession } from '@/lib/captive';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const result = await revokePortalSession(sessionId);
    return NextResponse.json({ success: result.success, result });
  } catch (error) {
    console.error('Error revoking portal session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
