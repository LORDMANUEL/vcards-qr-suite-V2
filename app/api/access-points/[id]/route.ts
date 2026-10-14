import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const accessPoint = await prisma.accessPoint.update({
      where: { id: params.id },
      data: {
        name: body.name,
        branchId: body.branchId,
        themeId: body.themeId || null,
        timeLimit: Number(body.timeLimit) || 60,
        fields: Array.isArray(body.fields) ? body.fields : [],
        timerVisible: body.timerVisible !== false,
        providerType: body.providerType || 'GENERIC',
        ssid: body.ssid || null,
        wifiPassword: body.wifiPassword || null,
        wifiSecurity: body.wifiSecurity || 'WPA',
        externalUrl: body.externalUrl || null,
        identifier: body.identifier,
        isActive: body.isActive !== false,
        radiusNasId: body.radiusNasId || null,
        radiusSecret: body.radiusSecret || null,
        uamServer: body.uamServer || null,
        uamAllowed: Array.isArray(body.uamAllowed) ? body.uamAllowed : [],
        uamDomain: Array.isArray(body.uamDomain) ? body.uamDomain : [],
        outageBypassEnabled: body.outageBypassEnabled === true,
        outageBypassNotes: body.outageBypassNotes || null,
      },
    });

    return NextResponse.json({ accessPoint, success: true });
  } catch (error) {
    console.error('Error updating access point:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.accessPoint.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting access point:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}