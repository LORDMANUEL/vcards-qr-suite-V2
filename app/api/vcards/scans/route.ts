import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDeviceType, getLocationFromIP } from '@/lib/geolocation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canViewVcards } from '@/lib/permissions';
import { parseScanReportQuery } from '@/lib/scan-query';

const RATE_LIMIT_MS = 60000;
const MAX_SCANS_PER_MINUTE = Number(process.env.VCARD_MAX_SCANS_PER_MINUTE || 15);
const ALLOWED_SCAN_METHODS = new Set(['QR', 'MANUAL', 'DIRECT']);

async function isRateLimited(ip: string, vcardId: string, scanMethod: string) {
  const cutoff = new Date(Date.now() - RATE_LIMIT_MS);

  const [recentSameEvent, recentTotalByIp] = await Promise.all([
    prisma.scan.findFirst({
      where: {
        ipAddress: ip,
        vcardId,
        scanMethod,
        scannedAt: { gte: cutoff },
      },
      select: { id: true },
    }),
    prisma.scan.count({
      where: {
        ipAddress: ip,
        scannedAt: { gte: cutoff },
        NOT: { scanMethod: { startsWith: 'click_' } },
      },
    }),
  ]);

  return Boolean(recentSameEvent) || recentTotalByIp >= MAX_SCANS_PER_MINUTE;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vcardId, scanMethod = 'QR' } = body;

    if (!vcardId) {
      return NextResponse.json({ error: 'vcardId is required' }, { status: 400 });
    }

    const vcard = await prisma.vCard.findUnique({
      where: { id: String(vcardId) },
      select: { id: true, isActive: true, user: { select: { isActive: true } } },
    });

    if (!vcard || !vcard.isActive || !vcard.user.isActive) {
      return NextResponse.json({ error: 'vCard not found' }, { status: 404 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    const safeScanMethod = ALLOWED_SCAN_METHODS.has(String(scanMethod).toUpperCase())
      ? String(scanMethod).toUpperCase()
      : 'QR';

    if (await isRateLimited(ip, vcard.id, safeScanMethod)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Rate limited - scan already recorded recently',
        rateLimited: true 
      });
    }

    const location = await getLocationFromIP(ip);
    const deviceType = getDeviceType(userAgent);

    const scan = await prisma.scan.create({
      data: {
        vcardId: vcard.id,
        ipAddress: ip.slice(0, 45),
        userAgent: userAgent.slice(0, 500),
        deviceType,
        scanMethod: safeScanMethod,
        country: location?.country ?? 'Unknown',
        city: location?.city ?? 'Unknown',
      },
    });

    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (error) {
    console.error('Error recording scan:', error);
    return NextResponse.json({ error: 'Error recording scan' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canViewVcards(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const vcardId = searchParams.get('vcardId');
  const query = parseScanReportQuery(searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400 });
  const { page, limit, from, to } = query;
  if (!vcardId) return NextResponse.json({ error: 'vcardId is required' }, { status: 400 });

  try {
    const dateFilter = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lt: to } : {}),
    };
    const hasDateFilter = Boolean(from || to);
    const where = {
      vcardId,
      ...(hasDateFilter ? { scannedAt: dateFilter } : {}),
    };

    const [scans, totalScans, totalFiltered, byDevice, byDate] = await Promise.all([
      prisma.scan.findMany({
        where,
        orderBy: { scannedAt: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.scan.count({ where: { vcardId } }),
      prisma.scan.count({ where }),
      prisma.scan.groupBy({
        by: ['deviceType'],
        where: { vcardId },
        _count: true,
      }),
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT ("scannedAt" AT TIME ZONE 'America/Tegucigalpa')::date as date, COUNT(*)::int as count
        FROM "Scan"
        WHERE "vcardId" = ${vcardId}
        GROUP BY ("scannedAt" AT TIME ZONE 'America/Tegucigalpa')::date
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    return NextResponse.json({
      scans,
      totalScans,
      totalFiltered,
      byDevice: byDevice.map(d => ({ deviceType: d.deviceType, count: d._count })),
      byDate,
    });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json({ error: 'Error fetching scans' }, { status: 500 });
  }
}
