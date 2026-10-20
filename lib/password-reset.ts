import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth-security';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

export async function issuePasswordReset(email: string) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.isSystemUser || !user.isActive) {
    return { ok: true, sent: false, message: 'Si el correo existe, enviamos instrucciones de recuperacion.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://vcard.grupoyc.com';
  const resetUrl = new URL('/login/reset-password', baseUrl);
  resetUrl.searchParams.set('token', resetToken);
  const safeName = escapeHtml(user.name);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #003478; margin: 0;">Recuperación de Acceso</h2>
        <p style="color: #64748b; font-size: 14px;">YC VCard System - Ford Yude Canahuati</p>
      </div>
      
      <p>Hola <b>${safeName}</b>,</p>
      <p>Recibimos una solicitud para restablecer tu acceso. El enlace es válido durante 30 minutos y solo puede utilizarse una vez.</p>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${resetUrl.toString()}" style="background-color: #003478; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
          Crear nueva contraseña
        </a>
      </div>

      <hr style="margin-top: 40px; border: 0; border-top: 1px solid #f1f5f9;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Si no solicitaste este cambio, contacta al administrador de IT de inmediato.</p>
    </div>
  `;

  const sent = await sendMail({
    to: normalizedEmail,
    subject: 'Restablecer acceso - YC VCard System',
    text: `Hola ${user.name}. Usa este enlace durante los proximos 30 minutos para crear una nueva contrasena: ${resetUrl.toString()}`,
    html: htmlContent,
  });

  return {
    ok: true,
    sent,
    message: sent
      ? 'Si el correo existe, enviamos instrucciones de recuperacion.'
      : 'No se pudo enviar el correo de recuperacion. Contacta al administrador.',
  };
}
