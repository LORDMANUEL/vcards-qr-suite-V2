import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canManageCompanies } from '@/lib/permissions';
import { companyPatch } from '@/lib/company-patch';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageCompanies(String(session.user.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const data = companyPatch(body);
  if (!data) return NextResponse.json({ error: 'Datos de empresa inválidos o vacíos' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.company.findUnique({ where: { id: params.id } });
      if (!current) return null;
      // Company edits never synthesize, rename, move, recolor or re-theme a Branch.
      const company = await tx.company.update({ where: { id: params.id }, data });
      if (typeof data.name === 'string' && current.name !== data.name) {
        await tx.branch.updateMany({ where: { companyId: params.id }, data: { companyName: data.name } });
      }
      return company;
    }, { isolationLevel: 'Serializable' });
    if (!result) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    return NextResponse.json({ company: result });
  } catch (error) {
    console.error('Error updating Company', error);
    return NextResponse.json({ error: 'No se pudo editar la empresa; revise nombre/slug únicos' }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageCompanies(String(session.user.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const outcome = await prisma.$transaction(async tx => {
      // Lock parent to avoid creating an orphan during concurrent Branch POST.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Company" WHERE "id" = ${params.id} FOR UPDATE
      `;
      if (!locked.length) return 'missing' as const;
      const branches = await tx.branch.count({ where: { companyId: params.id } });
      if (branches > 0) return 'has-branches' as const;
      await tx.company.delete({ where: { id: params.id } });
      return 'deleted' as const;
    }, { isolationLevel: 'Serializable' });
    if (outcome === 'missing') return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    if (outcome === 'has-branches') return NextResponse.json({ error: 'No se permite eliminar empresa con sucursales. Reasigne mediante procedimiento autorizado.' }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Company', error);
    return NextResponse.json({ error: 'Empresa en uso o conflicto concurrente; no se eliminó' }, { status: 409 });
  }
}
