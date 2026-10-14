import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/auth-security';
import { issuePasswordReset } from '@/lib/password-reset';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Correo invalido' }, { status: 400 });
    }

    const result = await issuePasswordReset(email);
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
