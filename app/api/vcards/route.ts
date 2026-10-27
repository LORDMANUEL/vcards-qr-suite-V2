import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { createAuditLog } from '@/lib/audit';
import { canBulkImportVcards, canManageCompanies, canViewVcards } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { branchBelongsToCompany } from '@/lib/branch-integrity';
import { validateAdvisorCardCreation, cardCreationError, type CreationConflict } from '@/lib/vcard-account-integrity';

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

class AdvisorCreationError extends Error {
  constructor(public readonly conflict: CreationConflict) {
    super(cardCreationError[conflict]);
    this.name = 'AdvisorCreationError';
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

    if (!name || !email || !branchId) {
      return NextResponse.json({ error: 'Faltan datos requeridos (nombre, email, sucursal)' }, { status: 400 });
    }

    if (!canManageCompanies(role) && session.user.branchId !== branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const selectedBranch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, companyId: true } });
    if (!selectedBranch) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    if (!selectedBranch.companyId || !branchBelongsToCompany(selectedBranch, companyId)) {
      return NextResponse.json({ error: 'Empresa y sucursal no coinciden. Corrija su vinculación antes de crear la tarjeta.' }, { status: 422 });
    }

    // Generate the signed QR before opening a database transaction.
    // Failure to render the image must not create an orphan User.
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET no configurado' }, { status: 500 });
    }
    const qrCodeData = uuidv4();
    const signature = CryptoJS.HmacSHA256(qrCodeData, secret).toString(CryptoJS.enc.Hex);
    const baseUrl = resolvePublicBaseUrl(request);
    const finalUrl = `${baseUrl}/vcard/${qrCodeData}?sig=${signature}`;
    const qrImageUrl = await QRCode.toDataURL(finalUrl, {
      width: 400, margin: 2,
      color: { dark: '#003478', light: '#FFFFFF' },
    });

    // User and VCard must be committed together; a duplicate cannot reassign
    // an advisor already holding a card in another branch.
    const vcard = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
        include: { vcards: { select: { branchId: true } } },
      });

      const conflict = validateAdvisorCardCreation(existingUser, branchId);
      if (conflict) throw new AdvisorCreationError(conflict);

      let userId: string;
      if (existingUser) {
        const updated = await tx.user.update({
          where: { id: existingUser.id },
          data: { name, position, phone, website, photoUrl, branchId },
        });
        userId = updated.id;
      } else {
        const temporaryPassword = randomBytes(24).toString('hex');
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
        const newAdvisor = await tx.user.create({
          data: {
            email, name, password: hashedPassword,
            role: 'ADVISOR', isSystemUser: false,
            position, phone, website, photoUrl,
            branchId, isActive: true,
          },
        });
        userId = newAdvisor.id;
      }

      return tx.vCard.create({
        data: { userId, branchId, qrCodeData, qrImageUrl, isActive: true },
      });
    }, { isolationLevel: 'Serializable' });

    // An audit transport failure must not turn an already committed creation
    // into a false HTTP 500 that causes the user to retry and duplicate it.
    try {
      await createAuditLog('CREATED', 'VCard', vcard.id, { qrId: qrCodeData, advisorEmail: email }, request);
    } catch (auditError) {
      console.error('vCard creada, pero no se pudo registrar el evento de auditoría:', auditError);
    }

    return NextResponse.json(vcard, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AdvisorCreationError) {
      return NextResponse.json({ error: error.message, code: error.conflict }, { status: 409 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error
        && (error.code === 'P2002' || error.code === 'P2034')) {
      return NextResponse.json({
        error: 'La cuenta o tarjeta cambió mientras se guardaba. Recargue y verifique que no exista una vCard duplicada.',
        code: 'CARD_WRITE_CONFLICT',
      }, { status: 409 });
    }
    console.error('Error creando vCard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
