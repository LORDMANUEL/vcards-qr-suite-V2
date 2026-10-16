import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageCompanies } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = String(session.user.role);
    const canManageAny = canManageCompanies(role);

    const body = await request.json();
    const { name, position, email, phone, website, photoUrl, branchId, companyId } = body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !branchId) {
      return NextResponse.json(
        { error: 'Nombre, email y sucursal son requeridos' },
        { status: 400 }
      );
    }

    const vcard = await prisma.vCard.findUnique({
      where: { id: params.id },
      include: { user: true, branch: true },
    });

    if (!vcard) {
      return NextResponse.json(
        { error: 'vCard no encontrada' },
        { status: 404 }
      );
    }

    if (!canManageAny && session.user.branchId !== branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const selectedBranch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!selectedBranch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    if (companyId && selectedBranch.companyId !== companyId) {
      return NextResponse.json(
        { error: 'La sucursal seleccionada no pertenece a la empresa indicada' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: vcard.userId },
        data: { name: String(name).trim(), position, email: normalizedEmail, phone, photoUrl, website, branchId },
      }),
      prisma.vCard.update({
        where: { id: params.id },
        data: { branchId: selectedBranch.id, updatedAt: new Date() },
      }),
    ]);

    const updatedVCard = await prisma.vCard.findUnique({
      where: { id: params.id },
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
    });

    return NextResponse.json({ vcard: updatedVCard });
  } catch (error) {
    console.error('Error updating vCard:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vCard' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!canManageCompanies(String(session.user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === '1';

    const vcard = await prisma.vCard.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            scans: true,
          },
        },
      },
    });

    if (!vcard) {
      return NextResponse.json(
        { error: 'vCard no encontrada' },
        { status: 404 }
      );
    }

    if (!forceDelete && vcard._count.scans > 0) {
      return NextResponse.json(
        {
          error: 'No se puede borrar la vCard porque tiene historial de escaneos. Usa force=1 si deseas eliminarla de forma definitiva.',
          scans: vcard._count.scans,
        },
        { status: 409 }
      );
    }

    await prisma.vCard.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'vCard eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting vCard:', error);
    return NextResponse.json(
      { error: 'Error al eliminar vCard' },
      { status: 500 }
    );
  }
}
