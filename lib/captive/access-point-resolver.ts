import { prisma } from '@/lib/prisma';

function uniqueCandidates(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
}

export async function resolvePortalAccessPoint(input: {
  branchId?: string | null;
  identifierCandidates?: Array<string | null | undefined>;
  allowGlobalFallback?: boolean;
}) {
  const candidates = uniqueCandidates(input.identifierCandidates || []);

  if (candidates.length > 0) {
    const orFilters = candidates.flatMap((candidate) => [
      { identifier: { equals: candidate, mode: 'insensitive' as const } },
      { radiusNasId: { equals: candidate, mode: 'insensitive' as const } },
      { ssid: { equals: candidate, mode: 'insensitive' as const } },
      { name: { equals: candidate, mode: 'insensitive' as const } },
    ]);

    const accessPoint = await prisma.accessPoint.findFirst({
      where: {
        isActive: true,
        OR: orFilters,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (accessPoint) {
      return accessPoint;
    }
  }

  if (input.branchId) {
    const branchAccessPoints = await prisma.accessPoint.findMany({
      where: { branchId: input.branchId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    if (branchAccessPoints.length === 1) {
      return branchAccessPoints[0];
    }
  }

  if (!input.allowGlobalFallback) {
    return null;
  }

  const activeAccessPoints = await prisma.accessPoint.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });

  if (activeAccessPoints.length === 1) {
    return activeAccessPoints[0];
  }

  return null;
}