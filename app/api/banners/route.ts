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

        const banners = await prisma.banner.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
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
        const { name, imageUrl, targetUrl, isActive } = body;

        const banner = await prisma.banner.create({
            data: {
                name,
                imageUrl,
                targetUrl,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ banner }, { status: 201 });
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}