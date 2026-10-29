import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canBulkImportVcards, canManageSystemUsers } from '@/lib/permissions';
import { usersDirectoryPolicy } from '@/lib/users-directory-policy';
import { secureUserCreation } from '@/lib/secure-user-creation';
import { randomBytes } from 'node:crypto';
import type { UserRole } from '@prisma/client';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const kind = searchParams.get('kind') || 'all';
        const policy = usersDirectoryPolicy(kind, String(session.user.role), session.user.branchId);
        if (!policy.ok) return NextResponse.json({ error: policy.error }, { status: policy.status });

        const users = await prisma.user.findMany({
            where: {
                ...(policy.kind === 'system' ? { isSystemUser: true } : policy.kind === 'vcard' ? { isSystemUser: false } : {}),
                ...(policy.branchId ? { branchId: policy.branchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true, isSystemUser: true,
                position: true, phone: true, website: true, branchId: true,
                photoUrl: true, isActive: true, createdAt: true, updatedAt: true,
                branch: { select: { name: true } },
                _count: { select: { vcards: true } },
            },
        });
        const safeUsers = users;
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

        const body = await req.json().catch(() => null);
        const policy = secureUserCreation(body, String(session.user.role), session.user.branchId);
        if (!policy.ok) return NextResponse.json({ error: policy.error }, { status: policy.status });
        const { name, email, role, branchId, isSystemUser } = policy;
        const { password, position, phone, website, isActive, photoUrl } = body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const finalIsSystemUser = isSystemUser;
        const rawPassword = typeof password === 'string' && password.length >= 12
          ? password : randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as UserRole,
                isSystemUser: finalIsSystemUser,
                position,
                phone,
                website,
                branchId: branchId || null,
                photoUrl: photoUrl || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        // Audit must not turn an already committed account creation into a retry.
        try { await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATED',
                entityName: 'User',
                entityId: user.id,
                details: JSON.stringify({ email: user.email, name: user.name, role: user.role }),
            }
        });

        } catch (auditError) { console.error('User created but audit failed', auditError); }
        const { password: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}