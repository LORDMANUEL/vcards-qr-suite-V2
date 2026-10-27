import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'IT', 'SUPER_ADMIN'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const nextName = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!nextName) return NextResponse.json({ error: 'Nombre de empresa requerido' }, { status: 400 });

  try {
    const company = await prisma.$transaction(async (tx) => {
      const current = await tx.company.findUnique({ where: { id: params.id } });
      if (!current) return null;

      // Editing a company must NOT rename the first branch, create branches
      // or overwrite branch-specific themes/colors. Branches have their own API.
      const updated = await tx.company.update({
        where: { id: params.id },
        data: {
          name: nextName,
          slug: body.slug ? String(body.slug).trim() : null,
          logoUrl: body.logoUrl || null,
          primaryColor: body.primaryColor || current.primaryColor,
          secondaryColor: body.secondaryColor || current.secondaryColor,
          defaultVcardThemeId: body.defaultVcardThemeId || null,
          seasonalVcardThemeId: body.seasonalVcardThemeId || null,
        },
      });
      if (current.name !== nextName) {
        await tx.branch.updateMany({
          where: { companyId: params.id },
          data: { companyName: nextName },
        });
      }
      return updated;
    });
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la empresa. Verifique nombre y slug únicos.' }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'IT', 'SUPER_ADMIN'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Never turn all related branches into orphans just to delete a company.
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { _count: { select: { branches: true } } },
  });
  if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
  if (company._count.branches > 0) {
    return NextResponse.json({
      error: 'No puede eliminar una empresa con sucursales. Reasigne manualmente cada sucursal con autorización.',
      branches: company._count.branches,
    }, { status: 409 });
  }
  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
