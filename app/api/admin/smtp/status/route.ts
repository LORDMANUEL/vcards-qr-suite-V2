import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageSystemUsers } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageSystemUsers(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || '0'),
    user: process.env.SMTP_USER || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    secure: Number(process.env.SMTP_PORT || '587') === 465,
    configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS),
  });
}