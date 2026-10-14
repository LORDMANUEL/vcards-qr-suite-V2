import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePortalAccessPoint } from '@/lib/captive/access-point-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');
        const slug = searchParams.get('slug');
        const accessPointIdentifier = searchParams.get('ap');
        const accessPointCandidates = [
            accessPointIdentifier,
            searchParams.get('ap_mac'),
            searchParams.get('called'),
            searchParams.get('ssid'),
            searchParams.get('nasid'),
        ];

        if (!branchId && !slug && accessPointCandidates.every((value) => !value)) {
            return NextResponse.json({ error: 'branchId, slug or ap is required' }, { status: 400 });
        }

        const resolvedAccessPoint = await resolvePortalAccessPoint({
            branchId,
            identifierCandidates: accessPointCandidates,
            allowGlobalFallback: !branchId && !slug,
        });

        const accessPoint = resolvedAccessPoint ? await prisma.accessPoint.findUnique({
            where: { id: resolvedAccessPoint.id },
            include: {
                theme: true,
                branch: {
                    include: {
                        portalTheme: true,
                        portalConfig: true,
                    },
                },
            },
        }) : null;

        const branch = accessPoint?.branch || await prisma.branch.findFirst({
            where: {
                OR: [
                    { id: branchId || undefined },
                    { uniqueSlug: slug || undefined }
                ]
            },
            include: {
                portalTheme: true,
                portalConfig: true
            }
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        // Fetch banners, links and promotions (generic or branch-specific if implemented)
        const [banners, links, promotions] = await Promise.all([
            prisma.banner.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
            prisma.captivePortalLink.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
            prisma.promotion.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
        ]);

        const globalPortalTheme = (!accessPoint?.theme && !branch.portalTheme)
            ? await prisma.theme.findFirst({
                where: { category: 'PORTAL', isActive: true },
                orderBy: { updatedAt: 'desc' },
            })
            : null;

        return NextResponse.json({
            branch: {
                ...branch,
                portalTheme: accessPoint?.theme || branch.portalTheme || globalPortalTheme,
            },
            accessPoint,
            banners,
            links,
            promotions
        });
    } catch (error) {
        console.error('Error fetching portal info:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
