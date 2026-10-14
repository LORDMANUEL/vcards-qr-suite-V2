import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageSystemUsers } from '@/lib/permissions';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageSystemUsers(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                branch: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageSystemUsers(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role, position, phone, website, branchId, isActive, photoUrl, isSystemUser } = body;

        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const dataToUpdate: any = {
            name,
            email,
            role,
            ...(isSystemUser !== undefined ? { isSystemUser } : {}),
            position,
            phone,
            website,
            branchId: branchId || null,
            photoUrl: photoUrl || null,
            isActive: isActive !== undefined ? isActive : true,
        };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: dataToUpdate,
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATED',
                entityName: 'User',
                entityId: user.id,
                details: JSON.stringify({ email: user.email, role: user.role }),
            }
        });

        const { password: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageSystemUsers(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: params.id },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'DELETED',
                entityName: 'User',
                entityId: params.id,
                details: JSON.stringify({ email: existingUser.email, name: existingUser.name }),
            }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}