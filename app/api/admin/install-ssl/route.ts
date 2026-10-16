import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { execFile } from 'child_process';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (process.env.ENABLE_SSL_INSTALLER !== 'true') {
            return NextResponse.json(
                { error: 'La instalación HTTPS se encuentra deshabilitada en esta fase.' },
                { status: 409 }
            );
        }

        const body = await req.json();
        const { domain } = body;

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Run the script in the background
        // Safety check: Domain should be a valid hostname
        if (!/^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(domain)) {
            return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
        }

        execFile('bash', ['./scripts/install-ssl.sh', domain], (error: Error | null, stdout: string | Buffer) => {
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
