import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const themes = await prisma.theme.findMany({
            where: category ? { category: category as any } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        portalBranches: true,
                        vcardBranches: true,
                        legacyBranches: true
                    }
                }
            }
        });

        return NextResponse.json({ themes });
    } catch (error) {
        console.error('Error fetching themes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, category, type, colors, typography, config, htmlTemplate, cssCustom, bgImageUrl, isActive, validFrom, validTo, companyId } = body;

        const theme = await prisma.theme.create({
            data: {
                name,
                category: category || 'VCARD',
                type: type || 'CORPORATE',
                colors: colors || "{\"primary\":\"#003478\",\"secondary\":\"#FFFFFF\",\"accent\":\"#10B981\"}",
                typography: typography || 'Inter',
                config: config || {},
                htmlTemplate: htmlTemplate || null,
                cssCustom: cssCustom || null,
                bgImageUrl,
                isActive: isActive !== undefined ? isActive : true,
                validFrom: validFrom ? new Date(validFrom) : null,
                validTo: validTo ? new Date(validTo) : null,
                companyId,
            },
        });

        return NextResponse.json({ theme }, { status: 201 });
    } catch (error) {
        console.error('Error creating theme:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}