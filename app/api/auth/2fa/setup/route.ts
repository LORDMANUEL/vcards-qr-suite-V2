import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import QRCode from 'qrcode';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBase32Secret, getOtpAuthUrl } from '@/lib/auth-security';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = user.twoFactorSecret || generateBase32Secret(20);
    if (!user.twoFactorSecret) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      });
    }

    const otpAuthUrl = getOtpAuthUrl(user.email, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    return NextResponse.json({
      otpAuthUrl,
      qrCodeDataUrl,
      secret,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error('2fa setup error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
