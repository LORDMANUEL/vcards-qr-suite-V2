import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { isValidEmail, verifyTotpCode } from './auth-security';

function sanitizeRedirectPath(rawPath: string): string {
  if (!rawPath) return '/dashboard';
  if (rawPath.includes('/login')) return '/login';
  if (rawPath.includes('/dashboard')) return '/dashboard';
  if (rawPath.startsWith('/api/auth')) return '/dashboard';
  return rawPath.startsWith('/') ? rawPath : '/dashboard';
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Correo y contraseña requeridos');
        }

        const normalizedEmail = String(credentials.email).trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
          throw new Error('Correo invalido');
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { branch: true },
        });

        if (!user || !user?.password) {
          throw new Error('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Credenciales inválidas');
        }

        if (!user?.isActive) {
          throw new Error('Usuario inactivo');
        }

        if (!user?.isSystemUser) {
          throw new Error('Este usuario no tiene acceso al panel');
        }

        if (user.twoFactorEnabled) {
          const otp = String(credentials.otp || '').trim();
          if (!otp) {
            throw new Error('Codigo de autenticacion requerido');
          }
          if (!user.twoFactorSecret || !verifyTotpCode(user.twoFactorSecret, otp, 1)) {
            throw new Error('Codigo de autenticacion invalido');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId ?? undefined,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.twoFactorEnabled = Boolean((user as any).twoFactorEnabled);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branchId = token.branchId as string | undefined;
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Accept only same-origin redirects and normalize suspicious callbackUrl values.
      if (url.startsWith('/')) {
        return `${baseUrl}${sanitizeRedirectPath(url)}`;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
          return `${baseUrl}${sanitizeRedirectPath(path)}`;
        }
      } catch {
        // Ignore invalid callback URLs and return a safe default.
      }

      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
