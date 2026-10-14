import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const link = await prisma.captivePortalLink.findUnique({
            where: { id: params.id },
        });

        if (!link) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Error fetching portal link:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, url, isActive } = body;

        const link = await prisma.captivePortalLink.update({
            where: { id: params.id },
            data: {
                name,
                url,
                isActive,
            },
        });

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Error updating portal link:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.captivePortalLink.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Portal Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting portal link:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}