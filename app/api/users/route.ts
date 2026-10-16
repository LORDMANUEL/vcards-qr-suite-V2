import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canBulkImportVcards, canManageSystemUsers } from '@/lib/permissions';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const kind = searchParams.get('kind') || 'vcard';
        if (!['system', 'vcard'].includes(kind)) {
            return NextResponse.json({ error: 'Invalid user kind' }, { status: 400 });
        }
        if (kind === 'system' && !canManageSystemUsers(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (kind === 'vcard' && !canBulkImportVcards(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const canManageAll = canManageSystemUsers(String(session.user.role));
        const scopedBranchId = !canManageAll ? session.user.branchId : undefined;
        if (!canManageAll && !scopedBranchId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: {
                isSystemUser: kind === 'system',
                ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                branch: {
                    select: { name: true }
                },
                _count: {
                    select: { vcards: true }
                }
            }
        });

        // Strip sensitive info like passwords
        const safeUsers = users.map((user: any) => {
            const {
                password,
                resetPasswordToken,
                resetPasswordExpires,
                twoFactorSecret,
                ...safeUser
            } = user;
            return safeUser;
        });

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
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
        if (!canManageSystemUsers(String(session.user.role)) && body?.isSystemUser !== false) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!canBulkImportVcards(String(session.user.role)) && body?.isSystemUser === false) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const { name, email, password, role, position, phone, website, branchId, isActive, photoUrl, isSystemUser } = body;

        if (!email || !name) {
            return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const finalIsSystemUser = isSystemUser !== false;
        const requestedRole = String(role || (finalIsSystemUser ? 'SAC' : 'ADVISOR'));
        const allowedRoles = ['ADMIN', 'IT', 'MARKETING', 'MARKETING_MANAGER', 'SAC', 'SALES_MANAGER', 'SUPER_ADMIN', 'ADVISOR'];
        if (!allowedRoles.includes(requestedRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        if (!finalIsSystemUser && requestedRole !== 'ADVISOR') {
            return NextResponse.json({ error: 'Los contactos vCard deben usar el rol ADVISOR' }, { status: 400 });
        }
        if (requestedRole === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const rawPassword = password || Math.random().toString(36).slice(2, 12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: requestedRole as any,
                isSystemUser: finalIsSystemUser,
                position,
                phone,
                website,
                branchId: branchId || null,
                photoUrl: photoUrl || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATED',
                entityName: 'User',
                entityId: user.id,
                details: JSON.stringify({ email: user.email, name: user.name, role: user.role }),
            }
        });

        const {
            password: _,
            resetPasswordToken: _resetToken,
            resetPasswordExpires: _resetExpires,
            twoFactorSecret: _twoFactorSecret,
            ...safeUser
        } = user;
        return NextResponse.json({ user: safeUser }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
