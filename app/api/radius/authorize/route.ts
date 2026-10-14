import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePortalAccessPoint } from '@/lib/captive/access-point-resolver';

export const dynamic = 'force-dynamic';

function normalizeMac(mac?: string | null) {
  return (mac || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function expandMacCandidates(mac?: string | null) {
  const normalized = normalizeMac(mac);
  if (normalized.length !== 12) {
    return Array.from(new Set([mac].filter(Boolean) as string[]));
  }

  const colon = normalized.match(/.{1,2}/g)?.join(':') || normalized;
  const hyphen = normalized.match(/.{1,2}/g)?.join('-') || normalized;
  const dot = `${normalized.slice(0, 4)}.${normalized.slice(4, 8)}.${normalized.slice(8, 12)}`;

  return Array.from(new Set([mac || '', normalized, colon, colon.toLowerCase(), hyphen, hyphen.toLowerCase(), dot, dot.toLowerCase()]));
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-radius-api-key');
    const expectedApiKey = process.env.RADIUS_API_SECRET;

    if (!expectedApiKey) {
      return NextResponse.json({ authorized: false, reason: 'RADIUS_API_SECRET is not configured' }, { status: 500 });
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json({ authorized: false, reason: 'Invalid API key' }, { status: 401 });
    }

    const body = await req.json();
    const macAddress = body.macAddress as string | undefined;
    const nasId = body.nasId as string | undefined;
    const ipAddress = body.ipAddress as string | undefined;

    if (!macAddress) {
      return NextResponse.json({ authorized: false, reason: 'macAddress is required' }, { status: 400 });
    }

    const candidates = expandMacCandidates(macAddress);
    const session = await prisma.portalSession.findFirst({
      where: {
        macAddress: { in: candidates },
      },
      include: {
        accessPoint: {
          select: {
            id: true,
            name: true,
            identifier: true,
            radiusNasId: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!session) {
      return NextResponse.json({ authorized: false, reason: 'No portal session found for MAC address' }, { status: 404 });
    }

    if (!session.accessPoint && nasId) {
      const resolvedAccessPoint = await resolvePortalAccessPoint({ identifierCandidates: [nasId] });
      if (resolvedAccessPoint) {
        await prisma.portalSession.update({
          where: { id: session.id },
          data: {
            apId: resolvedAccessPoint.id,
            branchId: session.branchId || resolvedAccessPoint.branchId,
            timeLimit: session.timeLimit || resolvedAccessPoint.timeLimit,
            statusDetail: `Resolved access point from RADIUS NAS ID: ${resolvedAccessPoint.name}`,
          },
        });

        session.accessPoint = {
          id: resolvedAccessPoint.id,
          name: resolvedAccessPoint.name,
          identifier: resolvedAccessPoint.identifier,
          radiusNasId: resolvedAccessPoint.radiusNasId,
        };
      }
    }

    const nasMatches = !nasId || !session.accessPoint || !session.accessPoint.radiusNasId || session.accessPoint.radiusNasId === nasId || session.accessPoint.identifier === nasId;
    if (!nasMatches) {
      return NextResponse.json({
        authorized: false,
        reason: 'NAS ID does not match the authorized access point',
        sessionId: session.id,
      }, { status: 403 });
    }

    const now = Date.now();
    const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : null;
    const isAuthorized = session.status === 'AUTHORIZED' && (!expiresAt || expiresAt > now);

    if (!isAuthorized) {
      return NextResponse.json({
        authorized: false,
        reason: session.status === 'AUTHORIZED' ? 'Session expired' : `Session status is ${session.status}`,
        sessionId: session.id,
        status: session.status,
      }, { status: 403 });
    }

    const timeoutSeconds = expiresAt ? Math.max(60, Math.floor((expiresAt - now) / 1000)) : session.timeLimit ? session.timeLimit * 60 : 3600;

    return NextResponse.json({
      authorized: true,
      sessionId: session.id,
      sessionTimeout: timeoutSeconds,
      reply: {
        'Reply-Message': 'Portal access approved',
        'Session-Timeout': timeoutSeconds,
      },
      context: {
        branch: session.branch?.name || null,
        accessPoint: session.accessPoint?.name || null,
        macAddress: session.macAddress,
        ipAddress: ipAddress || session.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('RADIUS authorize error:', error);
    return NextResponse.json({ authorized: false, reason: 'Internal Server Error' }, { status: 500 });
  }
}