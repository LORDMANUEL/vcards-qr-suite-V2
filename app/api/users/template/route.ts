import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { canBulkImportVcards } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canBulkImportVcards(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const branchId = url.searchParams.get('branchId');
  const companyId = url.searchParams.get('companyId');

  let rows;
  let fileName = 'plantilla-usuarios-vcard.xlsx';

  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, city: true, companyName: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    rows = [
      {
        name: 'Juan Perez',
        email: 'juan.perez@empresa.com',
        position: 'Asesor de Servicio',
        phone: '+50499999999',
        website: 'https://empresa.com',
        branchId: branch.id,
        branchName: branch.name,
        city: branch.city || '',
        photoUrl: '',
      },
    ];

    fileName = `plantilla-${(branch.name || 'sucursal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.xlsx`;
  } else if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        branches: {
          select: { id: true, name: true, city: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    rows = company.branches.length
      ? company.branches.map((branch, idx) => ({
          name: idx === 0 ? 'Juan Perez' : 'Maria Lopez',
          email: `${idx === 0 ? 'juan.perez' : 'maria.lopez'}@empresa.com`,
          position: 'Asesor de Servicio',
          phone: idx === 0 ? '+50499999999' : '+50498888888',
          website: 'https://empresa.com',
          branchId: branch.id,
          branchName: branch.name,
          city: branch.city || '',
          photoUrl: '',
        }))
      : [
          {
            name: 'Juan Perez',
            email: 'juan.perez@empresa.com',
            position: 'Asesor de Servicio',
            phone: '+50499999999',
            website: 'https://empresa.com',
            branchId: '',
            branchName: '',
            city: '',
            photoUrl: '',
          },
        ];

    fileName = `plantilla-${(company.name || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.xlsx`;
  } else {
    rows = [
      {
        name: 'Juan Perez',
        email: 'juan.perez@empresa.com',
        position: 'Asesor de Servicio',
        phone: '+50499999999',
        website: 'https://empresa.com',
        branchName: 'Yude Canahuati SA de CV - San Pedro Sula',
        city: 'San Pedro Sula',
        photoUrl: '',
      },
    ];
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'usuarios_vcard');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}