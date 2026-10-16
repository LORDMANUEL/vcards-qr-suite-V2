import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
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
                .filter(f => f.endsWith('.sql'))
                .map(async (f) => {
                    const stats = await fs.promises.stat(path.join(backupDir, f));
                    return {
                        name: f,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        format: 'sql'
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
            } catch (dumpError) {
                console.error('pg_dump failed:', dumpError);
                return NextResponse.json(
                    { error: 'No se pudo crear un respaldo PostgreSQL verificable.' },
                    { status: 503 }
                );
            }
        } else {
            return NextResponse.json(
                { error: 'DATABASE_URL no está configurada para un respaldo PostgreSQL.' },
                { status: 503 }
            );
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
