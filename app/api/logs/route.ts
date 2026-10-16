import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canViewAuditLogs } from '@/lib/permissions';

function maskIp(value: string | null) {
    if (!value) return null;
    if (value.includes(':')) return `${value.split(':').slice(0, 3).join(':')}:…`;
    const parts = value.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.x` : 'redacted';
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role check - Only Super Admins and local Admins can see logs (based on your structure, let's limit to SUPER_ADMIN)
        if (!canViewAuditLogs(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const requestedLimit = Number.parseInt(searchParams.get('limit') || '300', 10);
        const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 300, 1), 500);

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
            id: log.id,
            userId: log.userId,
            action: log.action,
            entityName: log.entityName,
            entityId: log.entityId,
            createdAt: log.createdAt,
            ipAddress: maskIp(log.ipAddress),
            user: userMap.get(log.userId) || { name: 'Usuario Eliminado', role: 'Desconocido' }
        }));

        return NextResponse.json({ logs: populatedLogs });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
