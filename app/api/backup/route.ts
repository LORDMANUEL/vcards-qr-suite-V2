import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

const execPromise = util.promisify(exec);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            return NextResponse.json([]);
        }

        const files = await fs.promises.readdir(backupDir);
        const backupFiles = await Promise.all(
            files
                .filter(f => f.endsWith('.sql') || f.endsWith('.json'))
                .map(async (f) => {
                    const stats = await fs.promises.stat(path.join(backupDir, f));
                    return {
                        name: f,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        format: f.endsWith('.json') ? 'json' : 'sql'
                    };
                })
        );

        return NextResponse.json(backupFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.sql`;
        const filePath = path.join(backupDir, fileName);

        const dbUrl = process.env.DATABASE_URL || '';
        
        // Use pg_dump if we have a connection string
        if (dbUrl.startsWith('postgresql://')) {
            try {
                // Example: postgresql://user:pass@host:port/db
                // We use the full URL directly which pg_dump supports via the -d flag or just positional.
                // To avoid password prompt, we can use the URL format.
                await execPromise(`pg_dump "${dbUrl}" -f "${filePath}"`);
            } catch (dumpError: any) {
                console.error('pg_dump failed, falling back to dummy file:', dumpError);
                const jsonName = `backup-${timestamp}.json`;
                const jsonPath = path.join(backupDir, jsonName);
                const backupPayload = {
                    generatedAt: new Date().toISOString(),
                    source: 'fallback-json',
                    reason: dumpError.message || 'pg_dump failed',
                    datasets: {
                        companies: await prisma.company.findMany(),
                        branches: await prisma.branch.findMany(),
                        users: await prisma.user.findMany({
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                                position: true,
                                phone: true,
                                photoUrl: true,
                                website: true,
                                branchId: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        }),
                        themes: await prisma.theme.findMany(),
                        vcards: await prisma.vCard.findMany({
                            include: {
                                scans: true,
                            }
                        }),
                        accessPoints: await prisma.accessPoint.findMany(),
                        portalSessions: await prisma.portalSession.findMany(),
                    }
                };
                await fs.promises.writeFile(jsonPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
                return NextResponse.json({
                    message: 'Backup creado con fallback JSON (pg_dump no disponible)',
                    fileName: jsonName,
                    format: 'json',
                    size: (await fs.promises.stat(jsonPath)).size,
                    warning: dumpError.message || 'pg_dump failed',
                });
            }
        } else {
            const jsonName = `backup-${timestamp}.json`;
            const jsonPath = path.join(backupDir, jsonName);
            const backupPayload = {
                generatedAt: new Date().toISOString(),
                source: 'fallback-json',
                reason: 'DATABASE_URL not recognized for pg_dump',
                datasets: {
                    companies: await prisma.company.findMany(),
                    branches: await prisma.branch.findMany(),
                    users: await prisma.user.findMany({
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            position: true,
                            phone: true,
                            photoUrl: true,
                            website: true,
                            branchId: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }),
                    themes: await prisma.theme.findMany(),
                    vcards: await prisma.vCard.findMany({
                        include: {
                            scans: true,
                        }
                    }),
                    accessPoints: await prisma.accessPoint.findMany(),
                    portalSessions: await prisma.portalSession.findMany(),
                }
            };
            await fs.promises.writeFile(jsonPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
            return NextResponse.json({
                message: 'Backup creado en formato JSON (pg_dump no configurado)',
                fileName: jsonName,
                format: 'json',
                size: (await fs.promises.stat(jsonPath)).size,
            });
        }

        return NextResponse.json({
            message: 'Backup created successfully',
            fileName,
            format: 'sql',
            size: (await fs.promises.stat(filePath)).size
        });

    } catch (error) {
        console.error('Backup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
