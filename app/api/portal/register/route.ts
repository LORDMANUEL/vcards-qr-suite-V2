import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePortalSession } from '@/lib/captive';
import { resolvePortalAccessPoint } from '@/lib/captive/access-point-resolver';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, ipAddress, branchId, apIdentifier, name, email, phone, carModel, vehicleYear, licensePlate, rtn, vin, metadata } = body;

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const accessPoint = await resolvePortalAccessPoint({
      branchId: branchId || null,
      identifierCandidates: [apIdentifier],
    });

    const timeLimit = accessPoint?.timeLimit || 180;
    const expiresAt = new Date(Date.now() + timeLimit * 60 * 1000);

    const session = await prisma.portalSession.upsert({
      where: { macAddress },
      update: {
        ipAddress: ipAddress || undefined,
        branchId: branchId || accessPoint?.branchId || undefined,
        apId: accessPoint?.id || undefined,
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        carModel: carModel || undefined,
        vehicleYear: vehicleYear || undefined,
        licensePlate: licensePlate || undefined,
        rtn: rtn || undefined,
        vin: vin || undefined,
        metadata: metadata || undefined,
        status: 'PENDING',
        authorizedAt: null,
        expiresAt,
        timeLimit,
        statusDetail: accessPoint ? `Pending authorization for ${accessPoint.name}` : 'Pending portal authorization',
      },
      create: {
        macAddress,
        ipAddress,
        branchId: branchId || accessPoint?.branchId || null,
        apId: accessPoint?.id || null,
        name,
        email,
        phone,
        carModel,
        vehicleYear,
        licensePlate,
        rtn,
        vin,
        metadata,
        status: 'PENDING',
        authorizedAt: null,
        expiresAt,
        timeLimit,
        statusDetail: accessPoint ? `Pending authorization for ${accessPoint.name}` : 'Pending portal authorization',
      },
      include: {
        accessPoint: { select: { id: true, name: true, identifier: true } },
      },
    });

    const authorization = await authorizePortalSession(session.id);
    const finalSession = await prisma.portalSession.findUnique({
      where: { id: session.id },
      include: {
        accessPoint: { select: { id: true, name: true, identifier: true, providerType: true } },
      },
    });

    return NextResponse.json({ session: finalSession, authorization });
  } catch (error) {
    console.error('Error registering portal session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
