import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageSystemUsers } from '@/lib/permissions';
import { sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageSystemUsers(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['informatica2@grupoyc.com', 'informatica4@grupoyc.com'],
      },
      isActive: true,
      isSystemUser: true,
    },
    select: {
      email: true,
      name: true,
    },
  });

  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  const sent: string[] = [];
  const failed: string[] = [];

  for (const user of users) {
    try {
      await sendMail({
        to: user.email,
        subject: 'Acceso de prueba a plataforma vCard',
        text: `Hola ${user.name}. Tu acceso de prueba a la plataforma vCard ya esta listo. Ingresa con tu correo en ${appUrl}/login. Por seguridad, cambia tu contrasena inmediatamente despues de entrar usando la opcion "Olvide mi contrasena" o desde la configuracion de tu cuenta cuando se habilite.`,
        html: `<p>Hola <b>${user.name}</b>,</p><p>Tu acceso de prueba a la plataforma vCard ya esta listo.</p><p><a href="${appUrl}/login">Ingresar a la plataforma</a></p><p>Por seguridad, cambia tu contrasena inmediatamente despues de entrar.</p><p>Usuario: <b>${user.email}</b></p>`,
      });
      sent.push(user.email);
    } catch (error) {
      console.error('smtp invite send error:', user.email, error);
      failed.push(user.email);
    }
  }

  return NextResponse.json({
    message: `Correos enviados: ${sent.length}. Fallidos: ${failed.length}.`,
    sent,
    failed,
  });
}