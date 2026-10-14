import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const accessPoints = await prisma.accessPoint.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: { select: { id: true, name: true } },
        theme: { select: { id: true, name: true } },
        _count: {
          select: {
            sessions: {
              where: {
                status: 'AUTHORIZED',
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      accessPoints: accessPoints.map((ap) => ({
        id: ap.id,
        name: ap.name,
        identifier: ap.identifier,
        providerType: ap.providerType,
        branchId: ap.branchId,
        branchName: ap.branch.name,
        themeId: ap.themeId,
        themeName: ap.theme?.name || null,
        ssid: ap.ssid,
        wifiPassword: ap.wifiPassword,
        wifiSecurity: ap.wifiSecurity,
        externalUrl: ap.externalUrl,
        radiusNasId: ap.radiusNasId,
        radiusSecret: ap.radiusSecret,
        uamServer: ap.uamServer,
        uamAllowed: Array.isArray(ap.uamAllowed) ? ap.uamAllowed : [],
        uamDomain: Array.isArray(ap.uamDomain) ? ap.uamDomain : [],
        timeLimit: ap.timeLimit,
        fields: Array.isArray(ap.fields) ? ap.fields : [],
        timerVisible: ap.timerVisible,
        isActive: ap.isActive,
        outageBypassEnabled: ap.outageBypassEnabled,
        outageBypassNotes: ap.outageBypassNotes,
        activeSessions: ap._count.sessions,
        portalUrl: `/portal?branchId=${ap.branchId}&ap=${ap.identifier}&mac={mac}&ip={ip}`,
      })),
    });
  } catch (error) {
    console.error('Error fetching access points:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      branchId,
      themeId,
      timeLimit,
      fields,
      timerVisible,
      providerType,
      ssid,
      wifiPassword,
      wifiSecurity,
      externalUrl,
      identifier,
      isActive,
      radiusNasId,
      radiusSecret,
      uamServer,
      uamAllowed,
      uamDomain,
      outageBypassEnabled,
      outageBypassNotes,
    } = body;

    if (!name || !branchId) {
      return NextResponse.json({ error: 'name and branchId are required' }, { status: 400 });
    }

    const accessPoint = await prisma.accessPoint.create({
      data: {
        name,
        branchId,
        themeId: themeId || null,
        timeLimit: Number(timeLimit) || 60,
        fields: Array.isArray(fields) ? fields : [],
        timerVisible: timerVisible !== false,
        providerType: providerType || 'GENERIC',
        ssid: ssid || null,
        wifiPassword: wifiPassword || null,
        wifiSecurity: wifiSecurity || 'WPA',
        externalUrl: externalUrl || null,
        identifier: identifier || `${branchId}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        isActive: isActive !== false,
        radiusNasId: radiusNasId || null,
        radiusSecret: radiusSecret || null,
        uamServer: uamServer || null,
        uamAllowed: Array.isArray(uamAllowed) ? uamAllowed : [],
        uamDomain: Array.isArray(uamDomain) ? uamDomain : [],
        outageBypassEnabled: outageBypassEnabled === true,
        outageBypassNotes: outageBypassNotes || null,
      },
    });

    return NextResponse.json({ accessPoint, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating access point:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}