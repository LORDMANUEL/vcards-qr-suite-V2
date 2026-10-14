import { AccessPointProvider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CudyCaptiveProvider } from './providers/cudy-provider';
import { ManualCaptiveProvider } from './providers/manual-provider';
import { CaptiveProvider, CaptiveProviderResult } from './types';

function getProvider(providerType: AccessPointProvider | null | undefined): CaptiveProvider {
  switch (providerType) {
    case 'CUDY':
      return new CudyCaptiveProvider();
    default:
      return new ManualCaptiveProvider();
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function authorizePortalSession(sessionId: string): Promise<CaptiveProviderResult> {
  const session = await prisma.portalSession.findUnique({
    where: { id: sessionId },
    include: { accessPoint: true },
  });

  if (!session) {
    throw new Error('Portal session not found');
  }

  if (!session.accessPoint) {
    const provider = new ManualCaptiveProvider();
    const result = await provider.authorizeClient({
      macAddress: session.macAddress,
      ipAddress: session.ipAddress,
      accessPointIdentifier: 'branch-default',
      durationMinutes: session.timeLimit || 60,
      accessPointName: 'Branch default',
    });

    await prisma.portalSession.update({
      where: { id: session.id },
      data: {
        status: result.success ? 'AUTHORIZED' : 'PENDING',
        authorizedAt: result.success ? new Date() : null,
        statusDetail: result.message,
      },
    });

    return result;
  }

  const provider = getProvider(session.accessPoint.providerType);
  const result = await provider.authorizeClient({
    macAddress: session.macAddress,
    ipAddress: session.ipAddress,
    accessPointIdentifier: session.accessPoint.identifier,
    durationMinutes: session.timeLimit || session.accessPoint.timeLimit,
    accessPointName: session.accessPoint.name,
    externalUrl: session.accessPoint.externalUrl,
    radiusNasId: session.accessPoint.radiusNasId,
    radiusSecret: session.accessPoint.radiusSecret,
    uamServer: session.accessPoint.uamServer,
    uamAllowed: toStringArray(session.accessPoint.uamAllowed),
    uamDomain: toStringArray(session.accessPoint.uamDomain),
  });

  await prisma.portalSession.update({
    where: { id: session.id },
    data: {
      status: result.success ? 'AUTHORIZED' : 'PENDING',
      authorizedAt: result.success ? new Date() : null,
      statusDetail: result.message,
    },
  });

  return result;
}

export async function revokePortalSession(sessionId: string): Promise<CaptiveProviderResult> {
  const session = await prisma.portalSession.findUnique({
    where: { id: sessionId },
    include: { accessPoint: true },
  });

  if (!session) {
    throw new Error('Portal session not found');
  }

  const provider = session.accessPoint ? getProvider(session.accessPoint.providerType) : new ManualCaptiveProvider();
  const result = await provider.revokeClient({
    macAddress: session.macAddress,
    accessPointIdentifier: session.accessPoint?.identifier || 'branch-default',
    accessPointName: session.accessPoint?.name || 'Branch default',
    externalUrl: session.accessPoint?.externalUrl,
    radiusNasId: session.accessPoint?.radiusNasId,
    radiusSecret: session.accessPoint?.radiusSecret,
    uamServer: session.accessPoint?.uamServer,
  });

  await prisma.portalSession.update({
    where: { id: session.id },
    data: {
      status: result.success ? 'REVOKED' : session.status,
      revokedAt: result.success ? new Date() : session.revokedAt,
      expiresAt: result.success ? new Date() : session.expiresAt,
      statusDetail: result.message,
    },
  });

  return result;
}

export async function expirePortalSessions(): Promise<number> {
  const expiredSessions = await prisma.portalSession.findMany({
    where: {
      status: 'AUTHORIZED',
      expiresAt: { lte: new Date() },
    },
    select: { id: true },
  });

  for (const session of expiredSessions) {
    try {
      await revokePortalSession(session.id);
      await prisma.portalSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
    } catch (error) {
      console.error(`Failed to expire portal session ${session.id}:`, error);
    }
  }

  return expiredSessions.length;
}
