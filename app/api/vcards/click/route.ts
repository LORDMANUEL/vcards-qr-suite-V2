import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validClickEvent } from '@/lib/vcard-click-policy';
import { verifyVCardSignature } from '@/lib/security';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTION_TYPES = new Set(['tel', 'email', 'wa', 'download', 'share', 'sms', 'web', 'link', 'location']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = validClickEvent(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { vcardId, actionType } = parsed;
    const vcard = await prisma.vCard.findUnique({
      where: { id: vcardId },
      select: { id: true, qrCodeData: true, isActive: true, user: { select: { isActive: true } } },
    });
    if (!vcard || !vcard.isActive || !vcard.user.isActive)
      return NextResponse.json({ error: 'vCard not found' }, { status: 404 });
    if (!verifyVCardSignature(vcard.qrCodeData, typeof body.sig === 'string' ? body.sig : undefined))
      return NextResponse.json({ error: 'Firma QR inválida' }, { status: 403 });

    const safeType = actionType;
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

    await prisma.scan.create({
      data: {
        vcardId: vcard.id,
        ipAddress: ip.slice(0, 45),
        userAgent: userAgent.slice(0, 500),
        deviceType,
        scanMethod: `click_${safeType}`,
        country: null,
        city: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    return NextResponse.json({ error: 'Error recording click' }, { status: 500 });
  }
}
