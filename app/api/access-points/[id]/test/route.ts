import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authorizePortalSession, revokePortalSession } from '@/lib/captive';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accessPoint = await prisma.accessPoint.findUnique({ where: { id: params.id } });
    if (!accessPoint) {
      return NextResponse.json({ error: 'Access Point not found' }, { status: 404 });
    }

    const macAddress = `TEST-${Date.now()}`.slice(0, 17);
    const expiresAt = new Date(Date.now() + accessPoint.timeLimit * 60 * 1000);

    const portalSession = await prisma.portalSession.create({
      data: {
        macAddress,
        ipAddress: '127.0.0.1',
        branchId: accessPoint.branchId,
        apId: accessPoint.id,
        status: 'PENDING',
        timeLimit: accessPoint.timeLimit,
        expiresAt,
        statusDetail: 'Temporary integration test session',
      },
    });

    const authorizeResult = await authorizePortalSession(portalSession.id);
    const revokeResult = await revokePortalSession(portalSession.id);

    await prisma.portalSession.delete({ where: { id: portalSession.id } });

    return NextResponse.json({
      success: authorizeResult.success && revokeResult.success,
      authorizeResult,
      revokeResult,
      portalUrl: `/portal?branchId=${accessPoint.branchId}&ap=${accessPoint.identifier}&mac={mac}&ip={ip}`,
    });
  } catch (error) {
    console.error('Error testing access point integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}