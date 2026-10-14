import { PrismaClient } from '@prisma/client';
import { sendMail } from '../lib/mailer';

const prisma = new PrismaClient();

async function main() {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
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

  for (const user of users) {
    await sendMail({
      to: user.email,
      subject: 'Acceso de prueba a plataforma vCard',
      text: `Hola ${user.name}. Tu acceso de prueba a la plataforma vCard ya esta listo. Ingresa en ${appUrl}/login con tu correo. Por seguridad, cambia tu contrasena inmediatamente al entrar.`,
      html: `<p>Hola <b>${user.name}</b>,</p><p>Tu acceso de prueba a la plataforma vCard ya esta listo.</p><p><a href="${appUrl}/login">Ingresar a la plataforma</a></p><p>Por seguridad, cambia tu contrasena inmediatamente al entrar.</p><p>Usuario: <b>${user.email}</b></p>`,
    });
    console.log(`MAIL_SENT ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error('MAIL_SEND_ERROR', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
