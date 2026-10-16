import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageCompanies, canViewVcards } from '@/lib/permissions';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = String(session.user.role);
        if (!canViewVcards(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const scopedBranchId = !canManageCompanies(role) ? session.user.branchId : undefined;
        if (!canManageCompanies(role) && !scopedBranchId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const requestedLimit = Number.parseInt(searchParams.get('limit') || '100', 10);
        const limit = Number.isFinite(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 500)
            : 100;

        // Fetch latest scans including user and branch info
        const scans = await prisma.scan.findMany({
            where: scopedBranchId ? { vcard: { branchId: scopedBranchId } } : undefined,
            take: limit,
            orderBy: { scannedAt: 'desc' },
            include: {
                vcard: {
                    include: {
                        user: {
                            select: { name: true, role: true }
                        },
                        branch: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        // Flatten data for easier consumption via CSV exports or Tables
        const formattedScans = scans.map((scan: any) => ({
            id: scan.id,
            date: scan.scannedAt,
            city: scan.city || '-',
            country: scan.country || '-',
            deviceType: scan.deviceType || 'Unknown',
            scanMethod: scan.scanMethod || 'QR',
            advisorName: scan.vcard.user.name,
            advisorRole: scan.vcard.user.role,
            branchName: scan.vcard.branch?.name || 'Central'
        }));

        return NextResponse.json({ reports: formattedScans });
    } catch (error) {
        console.error('Error fetching reports data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
