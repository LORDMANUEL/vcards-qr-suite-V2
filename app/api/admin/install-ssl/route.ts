import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { domain } = body;

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Run the script in the background
        // Safety check: Domain should be a valid hostname
        if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
            return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
        }

        exec(`bash ./scripts/install-ssl.sh ${domain}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`SSL Script Error: ${error}`);
                return;
            }
            console.log(`SSL Script Output: ${stdout}`);
        });

        return NextResponse.json({ message: 'Proceso de instalación SSL iniciado en segundo plano.' });
    } catch (error) {
        console.error('Error triggering SSL script:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}