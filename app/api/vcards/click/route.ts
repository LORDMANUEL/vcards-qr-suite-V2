import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTION_TYPES = new Set(['tel', 'email', 'wa', 'download', 'share', 'sms', 'web', 'link', 'location']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vcardId, actionType } = body;

    if (!vcardId || !actionType) {
      return NextResponse.json({ error: 'vcardId and actionType required' }, { status: 400 });
    }

    // Sanitize actionType to prevent injection
    const safeType = String(actionType).replace(/[^a-z0-9_]/gi, '').slice(0, 30);

    if (!ALLOWED_ACTION_TYPES.has(safeType)) {
      return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
    }

    const vcard = await prisma.vCard.findUnique({
      where: { id: String(vcardId) },
      select: { id: true },
    });

    if (!vcard) {
      return NextResponse.json({ error: 'vCard not found' }, { status: 404 });
    }

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
