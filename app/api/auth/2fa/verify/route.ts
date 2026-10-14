import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTotpCode } from '@/lib/auth-security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Codigo invalido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: 'Primero configura tu app autenticadora' }, { status: 400 });
    }

    const ok = verifyTotpCode(user.twoFactorSecret, code, 1);
    if (!ok) {
      return NextResponse.json({ error: 'Codigo invalido o vencido' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ message: '2FA habilitado correctamente.' });
  } catch (error) {
    console.error('2fa verify error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
