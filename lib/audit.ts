import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type ActionPayload = 'CREATED' | 'UPDATED' | 'DELETED' | 'LOGIN' | 'FAILED_LOGIN';

export async function createAuditLog(
    action: ActionPayload,
    entityName: string,
    entityId: string,
    details?: any,
    req?: Request
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || 'SYSTEM_OR_UNAUTHORIZED';

        let ipAddress = 'unknown';
        if (req) {
            ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                req.headers.get('x-real-ip') ||
                'unknown';
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityName,
                entityId,
                details: details ? JSON.stringify(details) : null,
                ipAddress
            }
        });

    } catch (error) {
        // In production, Audit failures should be alerted without breaking the main flow
        console.error('CRITICAL: Failed to save Audit Log ISO 27001:', error);
    }
}
