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

        const promotions = await prisma.promotion.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
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
        const { title, description, imageUrl, targetUrl, startDate, endDate, isActive } = body;

        const promotion = await prisma.promotion.create({
            data: {
                title,
                description,
                imageUrl,
                targetUrl,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ promotion }, { status: 201 });
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}