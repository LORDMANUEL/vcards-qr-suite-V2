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

        // Role check - Only Super Admins and local Admins can see logs (based on your structure, let's limit to SUPER_ADMIN)
        if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN_AGENCIA') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '500');

        // Mapeo manual porque AuditLog no tiene relacion nativa Prisma hacia User para mantener la simplicidad del log inmutable
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const userIds = [...new Set(logs.map((log: any) => log.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, role: true }
        });

        const userMap = new Map(users.map((u: any) => [u.id, u]));

        const populatedLogs = logs.map((log: any) => ({
            ...log,
            user: userMap.get(log.userId) || { name: 'Usuario Eliminado', role: 'Desconocido' }
        }));

        return NextResponse.json({ logs: populatedLogs });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
