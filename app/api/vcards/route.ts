import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { createAuditLog } from '@/lib/audit';
import { canBulkImportVcards, canManageCompanies, canViewVcards } from '@/lib/permissions';
import { isValidEmail } from '@/lib/auth-security';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

function resolvePublicBaseUrl(request: Request) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const proto = forwardedProto || 'https';

  return host ? `${proto}://${host}` : 'http://127.0.0.1:3000';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = String(session.user.role);
    if (!canViewVcards(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause = canManageCompanies(role)
      ? undefined
      : session.user.branchId
        ? { branchId: session.user.branchId }
        : null;

    if (whereClause === null) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vcards = await prisma.vCard.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            email: true,
            phone: true,
            photoUrl: true,
            website: true,
          },
        },
        branch: {
          select: {
            id: true,
            city: true,
            companyId: true,
            companyName: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ vcards });
  } catch (error) {
    console.error('Error fetching vCards:', error);
    return NextResponse.json(
      { error: 'Error al obtener vCards' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = String(session.user.role);
    if (!canBulkImportVcards(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, email, position, phone, website, photoUrl, branchId, companyId
    } = body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !isValidEmail(normalizedEmail) || !branchId) {
      return NextResponse.json({ error: 'Faltan datos requeridos (nombre, email, sucursal)' }, { status: 400 });
    }

    if (!canManageCompanies(role) && session.user.branchId !== branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const selectedBranch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, companyId: true },
    });

    if (!selectedBranch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    if (companyId && selectedBranch.companyId !== companyId) {
      return NextResponse.json(
        { error: 'La sucursal seleccionada no pertenece a la empresa indicada' },
        { status: 400 }
      );
    }

    const qrCodeData = uuidv4();

    // Security: Generate HMAC Signature for Anti-Cloning
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET no configurado' }, { status: 500 });
    }
    const signature = CryptoJS.HmacSHA256(qrCodeData, secret).toString(CryptoJS.enc.Hex);

    const baseUrl = resolvePublicBaseUrl(request);
    const finalUrl = `${baseUrl}/vcard/${qrCodeData}?sig=${signature}`;

    const qrImageUrl = await QRCode.toDataURL(finalUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#003478',
        light: '#FFFFFF'
      }
    });

    const generatedPassword = randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    const vcard = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: String(name).trim(),
            password: hashedPassword,
            role: 'ADVISOR',
            isSystemUser: false,
            position,
            phone,
            website,
            photoUrl,
            branchId,
            isActive: true,
          },
        });
      } else {
        if (user.isSystemUser) {
          throw new Error('SYSTEM_USER_CONFLICT');
        }
        const existingVCard = await tx.vCard.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });
        if (existingVCard) {
          throw new Error('VCARD_ALREADY_EXISTS');
        }

        user = await tx.user.update({
          where: { id: user.id },
          data: { name: String(name).trim(), position, phone, website, photoUrl, branchId },
        });
      }

      return tx.vCard.create({
        data: { userId: user.id, branchId, qrCodeData, qrImageUrl, isActive: true },
      });
    });

    // ISO 27001 Audit
    await createAuditLog('CREATED', 'VCard', vcard.id, { qrId: qrCodeData, advisorEmail: normalizedEmail }, request);

    return NextResponse.json(vcard, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'VCARD_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'El usuario ya tiene una vCard en esta sucursal' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'SYSTEM_USER_CONFLICT') {
      return NextResponse.json(
        { error: 'Ese correo pertenece a un usuario administrativo y no puede reutilizarse para una vCard' },
        { status: 409 }
      );
    }
    console.error('Error creando vCard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
