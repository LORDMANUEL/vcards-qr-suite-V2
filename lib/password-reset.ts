import { prisma } from '@/lib/prisma';
import { isValidEmail } from '@/lib/auth-security';
import { sendMail } from '@/lib/mailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function issuePasswordReset(email: string) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return { ok: true, sent: false, message: 'Si el correo existe, enviamos instrucciones de recuperacion.' };
  }

  // Generar contraseña temporal legible pero segura
  const tempPassword = `Ford-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Actualizar la contraseña directamente
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://vcard.grupoyc.com';
  const loginUrl = `${baseUrl}/login`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #003478; margin: 0;">Recuperación de Acceso</h2>
        <p style="color: #64748b; font-size: 14px;">YC VCard System - Ford Yude Canahuati</p>
      </div>
      
      <p>Hola <b>\${user.name}</b>,</p>
      <p>Hemos restablecido tu acceso al sistema. Aquí tienes tus nuevas credenciales temporales:</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px dashed #cbd5e1;">
        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Contraseña Temporal</p>
        <p style="margin: 8px 0 0; font-family: monospace; font-size: 24px; color: #0f172a; font-weight: bold; letter-spacing: 2px;">\${tempPassword}</p>
      </div>

      <p style="color: #e11d48; font-size: 13px; font-weight: bold;">IMPORTANTE: Cambia esta contraseña inmediatamente después de ingresar por seguridad.</p>

      <div style="text-align: center; margin-top: 32px;">
        <a href="\${loginUrl}" style="background-color: #003478; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
          Ingresar al Panel Administrativo
        </a>
      </div>

      <hr style="margin-top: 40px; border: 0; border-top: 1px solid #f1f5f9;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Si no solicitaste este cambio, contacta al administrador de IT de inmediato.</p>
    </div>
  `;

  const sent = await sendMail({
    to: normalizedEmail,
    subject: 'Nueva contraseña temporal - YC VCard System',
    text: `Hola \${user.name}. Tu contraseña temporal es: \${tempPassword}. Ingresa en: \${loginUrl}`,
    html: htmlContent,
  });

  return {
    ok: true,
    sent,
    message: sent
      ? 'Nueva contraseña enviada correctamente al correo.'
      : 'Se generó la contraseña pero hubo un error al enviar el correo.',
    tempPassword,
  };
}
