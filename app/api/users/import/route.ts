import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { canBulkImportVcards } from '@/lib/permissions';

function resolvePublicBaseUrl(request: Request) {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const proto = forwardedProto || 'https';

  return host ? `${proto}://${host}` : 'http://127.0.0.1:3000';
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canBulkImportVcards(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const defaultBranchIdRaw = formData.get('defaultBranchId');
    const defaultBranchId = typeof defaultBranchIdRaw === 'string' ? defaultBranchIdRaw : '';
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    let createdUsers = 0;
    let createdVCards = 0;
    const skipped: string[] = [];
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'NEXTAUTH_SECRET no configurado' }, { status: 500 });
    }

    const baseUrl = resolvePublicBaseUrl(req);

    for (const row of rows) {
      const email = String(row.email || '').trim().toLowerCase();
      const name = String(row.name || '').trim();
      if (!email || !name) {
        skipped.push(`Fila sin email o nombre: ${JSON.stringify(row)}`);
        continue;
      }

      const branchQuery = [
        row.branchId ? { id: String(row.branchId) } : undefined,
        row.branchName ? { name: String(row.branchName) } : undefined,
        row.city ? { city: String(row.city) } : undefined,
      ].filter(Boolean) as any[];

      if (!branchQuery.length && defaultBranchId) {
        branchQuery.push({ id: defaultBranchId });
      }

      const branch = branchQuery.length
        ? await prisma.branch.findFirst({ where: { OR: branchQuery as any } })
        : null;

      if (!branch) {
        skipped.push(`Sin sucursal para ${email}`);
        continue;
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(2, 12), 10);
        user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'ADVISOR',
            isSystemUser: false,
            position: row.position ? String(row.position) : null,
            phone: row.phone ? String(row.phone) : null,
            website: row.website ? String(row.website) : null,
            photoUrl: row.photoUrl ? String(row.photoUrl) : null,
            branchId: branch.id,
            isActive: true,
          },
        });
        createdUsers += 1;
      }

      const existingVCard = await prisma.vCard.findFirst({ where: { userId: user.id } });
      if (!existingVCard) {
        const qrCodeData = uuidv4();
        const signature = CryptoJS.HmacSHA256(qrCodeData, secret).toString(CryptoJS.enc.Hex);
        const publicUrl = `${baseUrl}/vcard/${qrCodeData}?sig=${signature}`;
        const qrImageUrl = await QRCode.toDataURL(publicUrl, { width: 400, margin: 2, color: { dark: '#003478', light: '#FFFFFF' } });
        await prisma.vCard.create({
          data: {
            userId: user.id,
            branchId: branch.id,
            qrCodeData,
            qrImageUrl,
            isActive: true,
          },
        });
        createdVCards += 1;
      }
    }

    return NextResponse.json({ success: true, createdUsers, createdVCards, skipped });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}