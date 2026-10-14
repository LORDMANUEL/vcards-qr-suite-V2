import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageCompanies, canViewVcards } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const escaped = raw.replace(/"/g, '""');
  return /[",\n]/.test(raw) ? `"${escaped}"` : escaped;
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
            name: true,
            position: true,
            email: true,
            phone: true,
            website: true,
          },
        },
        branch: {
          select: {
            name: true,
            city: true,
            companyName: true,
          },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'id',
      'nombre',
      'puesto',
      'email',
      'telefono',
      'website',
      'empresa',
      'sucursal',
      'ciudad',
      'qrCodeData',
      'isActive',
      'downloadCount',
      'scanCount',
      'createdAt',
      'updatedAt',
    ];

    const rows = vcards.map((vcard) => [
      vcard.id,
      vcard.user.name,
      vcard.user.position || '',
      vcard.user.email,
      vcard.user.phone || '',
      vcard.user.website || '',
      vcard.branch?.companyName || '',
      vcard.branch?.name || '',
      vcard.branch?.city || '',
      vcard.qrCodeData,
      vcard.isActive,
      vcard.downloadCount,
      vcard._count.scans,
      vcard.createdAt.toISOString(),
      vcard.updatedAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vcards-export-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting vCards:', error);
    return NextResponse.json({ error: 'Error al exportar vCards' }, { status: 500 });
  }
}
