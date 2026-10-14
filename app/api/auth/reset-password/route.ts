import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashToken, isStrongPassword } from '@/lib/auth-security';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
    }

    if (!password || !isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'La contrasena debe tener al menos 8 caracteres, letras y numeros.' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Token vencido o invalido' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({ message: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
