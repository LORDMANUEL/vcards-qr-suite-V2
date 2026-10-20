import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageSystemUsers } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageSystemUsers(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'El envio masivo con destinatarios fijos fue retirado. Usa la recuperacion individual de cada usuario.' },
    { status: 410 },
  );
}
