import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';
import { authOptions } from '@/lib/auth';
import { canManageCompanies, canViewVcards } from '@/lib/permissions';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
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

        const scopeWhere = scopedBranchId ? { vcard: { branchId: scopedBranchId } } : undefined;

        // 1. Scans by Day (Last 7 days)
        const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
        const recentScans = await prisma.scan.findMany({
            where: {
                scannedAt: { gte: sevenDaysAgo },
                ...(scopeWhere || {})
            },
            select: {
                scannedAt: true
            }
        });

        const scansByDay = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const count = recentScans.filter(s => format(s.scannedAt, 'yyyy-MM-dd') === dateStr).length;
            return { date: format(date, 'MMM dd'), count };
        }).reverse();

        // 2. Scans by Branch + Top Advisors
        const scansWithContext = await prisma.scan.findMany({
            where: scopeWhere,
            select: {
                id: true,
                vcard: {
                    select: {
                        branch: {
                            select: { name: true }
                        },
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        const branchAgg: Record<string, number> = {};
        const advisorAgg: Record<string, number> = {};

        scansWithContext.forEach((scan) => {
            const branchName = scan.vcard?.branch?.name || 'Unknown';
            branchAgg[branchName] = (branchAgg[branchName] || 0) + 1;

            const advisorName = scan.vcard?.user?.name || 'Unknown';
            advisorAgg[advisorName] = (advisorAgg[advisorName] || 0) + 1;
        });

        const branchData = Object.entries(branchAgg).map(([name, value]) => ({ name, value }));
        const advisorData = Object.entries(advisorAgg)
            .map(([name, scans]) => ({ name, scans }))
            .sort((a, b) => b.scans - a.scans)
            .slice(0, 5);

        return NextResponse.json({
            scansByDay,
            branchData,
            advisorData
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}