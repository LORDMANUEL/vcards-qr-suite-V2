import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        if (branchId) {
            const config = await prisma.portalConfig.findUnique({
                where: { branchId }
            });
            return NextResponse.json({ config });
        }

        const configs = await prisma.portalConfig.findMany();
        return NextResponse.json({ configs });
    } catch (error) {
        console.error('Error fetching portal configs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MARKETING')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { branchId, requiredFields, sessionLimit, renewalLimit, isActive } = body;

        if (!branchId) {
            return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
        }

        const config = await prisma.portalConfig.upsert({
            where: { branchId },
            update: {
                requiredFields,
                sessionLimit,
                renewalLimit,
                isActive: isActive !== undefined ? isActive : true,
                updatedAt: new Date(),
            },
            create: {
                branchId,
                requiredFields: requiredFields || ["name", "email"],
                sessionLimit: sessionLimit || 180,
                renewalLimit: renewalLimit || 60,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ config });
    } catch (error) {
        console.error('Error saving portal config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
