import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageSystemUsers } from '@/lib/permissions';
import { issuePasswordReset } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageSystemUsers(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { email: true, isSystemUser: true },
  });

  if (!user || !user.isSystemUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const result = await issuePasswordReset(user.email);
  return NextResponse.json({
    message: result.message,
    sent: result.sent,
  });
}
