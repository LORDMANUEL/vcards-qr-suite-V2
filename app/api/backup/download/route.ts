import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const fileName = url.searchParams.get('file');
        
        if (!fileName) {
            return NextResponse.json({ error: 'File name required' }, { status: 400 });
        }

        // Basic security check to prevent directory traversal
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
        }

        const backupDir = path.join(process.cwd(), 'backups');
        const filePath = path.join(backupDir, fileName);

        if (!fileName.endsWith('.sql')) {
            return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileBuffer = await fs.promises.readFile(filePath);
        const contentType = 'application/sql';
        
        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': contentType,
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
