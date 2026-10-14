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

        // 1. Total KPIs
        const totalScans = await prisma.scan.count({
            where: scopedBranchId ? { vcard: { branchId: scopedBranchId } } : undefined,
        });
        const totalVCards = await prisma.vCard.count({
            where: {
                isActive: true,
                ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
            },
        });
        const totalBranches = scopedBranchId ? 1 : await prisma.branch.count();
        const totalUsers = await prisma.user.count({
            where: {
                isActive: true,
                ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
            },
        });

        // 2. Scans over last 7 days for the chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentScans = await prisma.scan.findMany({
            where: {
                scannedAt: {
                    gte: sevenDaysAgo,
                },
                ...(scopedBranchId ? { vcard: { branchId: scopedBranchId } } : {}),
            },
            select: {
                scannedAt: true,
                deviceType: true
            }
        });

        // Grouping for line chart
        const scanTrend = recentScans.reduce((acc: any, scan: any) => {
            const date = scan.scannedAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Device distribution
        const deviceTypes = recentScans.reduce((acc: any, scan: any) => {
            const type = scan.deviceType || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // 3. Top Advisors (Users)
        const topAdvisors = await prisma.user.findMany({
            take: 5,
            where: scopedBranchId ? { branchId: scopedBranchId } : undefined,
            select: {
                id: true,
                name: true,
                vcards: {
                    select: {
                        _count: {
                            select: { scans: true }
                        }
                    }
                }
            }
        });

        const formattedTopAdvisors = topAdvisors.map((user: any) => ({
            name: user.name,
            totalScans: user.vcards.reduce((sum: number, v: any) => sum + v._count.scans, 0)
        })).sort((a: any, b: any) => b.totalScans - a.totalScans).slice(0, 5);

        return NextResponse.json({
            kpis: {
                totalScans,
                totalVCards,
                totalBranches,
                totalUsers
            },
            charts: {
                trend: Object.keys(scanTrend).map((date: string) => ({ date, count: scanTrend[date] })).sort((a: any, b: any) => a.date.localeCompare(b.date)),
                devices: Object.keys(deviceTypes).map((type: string) => ({ type, count: deviceTypes[type] }))
            },
            topAdvisors: formattedTopAdvisors
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}