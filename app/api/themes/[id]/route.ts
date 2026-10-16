import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageThemes } from '@/lib/permissions';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageThemes(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const theme = await prisma.theme.findUnique({
            where: { id: params.id },
            include: {
                portalBranches: true,
                portalAccessPoints: true,
                vcardBranches: true,
                legacyBranches: true,
            }
        });

        if (!theme) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        return NextResponse.json({ theme });
    } catch (error) {
        console.error('Error fetching theme:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageThemes(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, category, type, colors, typography, config, htmlTemplate, cssCustom, bgImageUrl, isActive, validFrom, validTo, companyId } = body;

        const theme = await prisma.$transaction(async (tx) => {
            const currentTheme = await tx.theme.findUnique({ where: { id: params.id }, select: { category: true } });
            const resolvedCategory = category || currentTheme?.category;

            if (isActive === true && resolvedCategory === 'PORTAL') {
                await tx.theme.updateMany({
                    where: { category: 'PORTAL', NOT: { id: params.id } },
                    data: { isActive: false },
                });
            }

            return tx.theme.update({
                where: { id: params.id },
                data: {
                    ...(name !== undefined ? { name } : {}),
                    ...(category !== undefined ? { category } : {}),
                    ...(type !== undefined ? { type } : {}),
                    ...(colors !== undefined ? { colors } : {}),
                    ...(typography !== undefined ? { typography } : {}),
                    ...(config !== undefined ? { config } : {}),
                    ...(htmlTemplate !== undefined ? { htmlTemplate } : {}),
                    ...(cssCustom !== undefined ? { cssCustom } : {}),
                    ...(bgImageUrl !== undefined ? { bgImageUrl } : {}),
                    ...(isActive !== undefined ? { isActive } : {}),
                    ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
                    ...(validTo !== undefined ? { validTo: validTo ? new Date(validTo) : null } : {}),
                    ...(companyId !== undefined ? { companyId } : {}),
                },
            });
        });

        return NextResponse.json({ theme });
    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageThemes(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.theme.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Theme deleted successfully' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
