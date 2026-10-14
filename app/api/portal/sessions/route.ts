import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { expirePortalSessions } from '@/lib/captive';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await expirePortalSessions();
        const { searchParams } = new URL(req.url);
        const macAddress = searchParams.get('mac');
        const session = await getServerSession(authOptions);

        if (!macAddress && (!session || !session.user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const portalSessions = await prisma.portalSession.findMany({
            where: macAddress ? { macAddress } : undefined,
            orderBy: { updatedAt: 'desc' },
            include: {
                branch: {
                    select: { name: true }
                },
                accessPoint: {
                    select: { id: true, name: true, identifier: true, timeLimit: true, providerType: true }
                }
            },
            take: macAddress ? 1 : 100
        });

        return NextResponse.json({ sessions: portalSessions });
    } catch (error) {
        console.error('Error fetching portal sessions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { macAddress, ipAddress, branchId, apId, status, name, email, phone, carModel, vehicleYear, licensePlate, rtn, vin, metadata, timeLimit } = body;

        if (!macAddress) {
            return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
        }

        // Get branch config for session limits
        const [config, accessPoint] = await Promise.all([
            prisma.portalConfig.findUnique({
                where: { branchId: branchId || 'unknown' }
            }),
            apId ? prisma.accessPoint.findUnique({ where: { id: apId } }) : null,
        ]);

        const sessionLimit = Number(timeLimit) || accessPoint?.timeLimit || config?.sessionLimit || 180;
        const renewalLimit = config?.renewalLimit ?? 60;  // 1 hour (60 mins)

        // Find existing session
        const existingSession = await prisma.portalSession.findUnique({
            where: { macAddress }
        });

        let expiresAt = new Date();
        let renewalCount = existingSession?.renewalCount ?? 0;
        let lastRenewalAt = existingSession?.lastRenewalAt;

        if (existingSession) {
            // Check if already authorized and not expired
            if (existingSession.status === 'AUTHORIZED' && existingSession.expiresAt && existingSession.expiresAt > new Date()) {
                expiresAt = existingSession.expiresAt;
            } else {
                // Expired or new login -> Renewal (+1h)
                renewalCount += 1;
                lastRenewalAt = new Date();
                expiresAt = new Date(Date.now() + renewalLimit * 60000);
            }
        } else {
            // New device -> Initial (+3h)
            expiresAt = new Date(Date.now() + sessionLimit * 60000);
        }

        const portalSession = await prisma.portalSession.upsert({
            where: { macAddress },
            update: {
                ipAddress: ipAddress || undefined,
                branchId: branchId || undefined,
                apId: apId || undefined,
                status: status || 'AUTHORIZED',
                authorizedAt: status === 'AUTHORIZED' || !status ? new Date() : undefined,
                expiresAt,
                timeLimit: sessionLimit,
                renewalCount,
                lastRenewalAt,
                name: name || undefined,
                email: email || undefined,
                phone: phone || undefined,
                carModel: carModel || undefined,
                vehicleYear: vehicleYear || undefined,
                licensePlate: licensePlate || undefined,
                rtn: rtn || undefined,
                vin: vin || undefined,
                metadata: metadata || undefined,
                statusDetail: accessPoint ? `Access Point: ${accessPoint.name}` : undefined,
                updatedAt: new Date(),
            },
            create: {
                macAddress,
                ipAddress,
                branchId: branchId || null,
                apId: apId || null,
                status: status || 'AUTHORIZED',
                authorizedAt: status === 'AUTHORIZED' || !status ? new Date() : null,
                expiresAt,
                timeLimit: sessionLimit,
                renewalCount: 0,
                name,
                email,
                phone,
                carModel,
                vehicleYear,
                licensePlate,
                rtn,
                vin,
                metadata,
                statusDetail: accessPoint ? `Access Point: ${accessPoint.name}` : null,
            },
        });

        return NextResponse.json({ session: portalSession });
    } catch (error) {
        console.error('Error logging portal session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
