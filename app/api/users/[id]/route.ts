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

        // Do not allow a user to remove their own session-bearing account.
        if (session.user.id === params.id) {
            return NextResponse.json({ error: 'No puede eliminar su propia cuenta desde esta sesión.' }, { status: 409 });
        }

        // VCard.user uses onDelete: Cascade, and Scan.vcard also cascades.
        // This guard includes active and archived vCards and preserves all analytics.
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                email: true,
                name: true,
                _count: { select: { vcards: true } },
            },
        });
        if (!existingUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (existingUser._count.vcards > 0) {
            return NextResponse.json({
                code: 'USER_HAS_VCARDS',
                error: 'No puede eliminar este usuario: tiene vCards activas o archivadas y se perderían sus QR y escaneos. Desactive la cuenta o siga el procedimiento de retención aprobado.',
                vcards: existingUser._count.vcards,
            }, { status: 409 });
        }

        // Zero-card users may be deleted by authorized administrators. Any
        // concurrent new VCard should make the deletion fail through FK/transaction
        // constraints; production cleanup still requires change control.
        await prisma.user.delete({ where: { id: params.id } });

        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETED',
                    entityName: 'User',
                    entityId: params.id,
                    details: JSON.stringify({ email: existingUser.email, name: existingUser.name }),
                },
            });
        } catch (auditError) {
            // The deletion has already committed; do not report a false 500.
            console.error('Usuario eliminado, no se pudo registrar la auditoría:', auditError);
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}