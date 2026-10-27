import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageSystemUsers } from '@/lib/permissions';
import { deleteUnlinkedUser } from '@/lib/user-retention';

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
            // Omitted fields must preserve the existing account state:
            // never silently reactivate an inactive user, move branches or erase photo.
            ...(branchId !== undefined ? { branchId: branchId || null } : {}),
            ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
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

        // Serialize child-insert and delete with a parent row lock to prevent
        // a race that could delete a newly inserted vCard via ON DELETE CASCADE.
        const deletion = await deleteUnlinkedUser(prisma, params.id);
        if (deletion.status === 'not_found') {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }
        if (deletion.status === 'has_vcards') {
            return NextResponse.json({
                code: 'USER_HAS_VCARDS',
                error: 'No puede eliminar este usuario: tiene vCards activas o archivadas. Se perderían QR y escaneos. Desactive la cuenta o siga el procedimiento de retención.',
                vcards: deletion.vcards,
            }, { status: 409 });
        }

        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'DELETED',
                    entityName: 'User',
                    entityId: params.id,
                    details: JSON.stringify({ email: deletion.email, name: deletion.name }),
                },
            });
        } catch (auditError) {
            // The deletion has already committed; do not report a false 500.
            console.error('Usuario eliminado, no se pudo registrar la auditoría:', auditError);
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
            return NextResponse.json({ error: 'El registro cambió durante la operación. Intente nuevamente tras recargar.' }, { status: 409 });
        }
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 });
    }
}