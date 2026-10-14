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

        const links = await prisma.captivePortalLink.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ links });
    } catch (error) {
        console.error('Error fetching portal links:', error);
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
        const { name, url, isActive } = body;

        const link = await prisma.captivePortalLink.create({
            data: {
                name,
                url,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ link }, { status: 201 });
    } catch (error) {
        console.error('Error creating portal link:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}