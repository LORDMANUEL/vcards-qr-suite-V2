import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeBranches(branches: any[] | undefined, companyName: string) {
  if (!Array.isArray(branches)) return [];
  return branches
    .filter((branch) => branch?.city)
    .map((branch) => ({
      name: branch.name || `${companyName} - ${branch.city}`,
      city: branch.city,
      address: branch.address || null,
      country: branch.country || 'Honduras',
      uniqueSlug: branch.uniqueSlug || slugify(`${companyName}-${branch.city}`),
    }));
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'IT', 'SUPER_ADMIN'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body?.name || '').trim();
  const slug = slugify(String(body?.slug || name));
  if (!name || !slug) {
    return NextResponse.json({ error: 'Nombre de empresa requerido' }, { status: 400 });
  }
  const conflictingCompany = await prisma.company.findFirst({
    where: { id: { not: params.id }, OR: [{ name }, { slug }] },
    select: { id: true },
  });
  if (conflictingCompany) {
    return NextResponse.json({ error: 'Ya existe una empresa con ese nombre o slug' }, { status: 409 });
  }

  const company = await prisma.$transaction(async (tx) => {
    const current = await tx.company.findUnique({ where: { id: params.id } });
    const updated = await tx.company.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || '#003478',
        secondaryColor: body.secondaryColor || '#FFFFFF',
        defaultVcardThemeId: body.defaultVcardThemeId || null,
        seasonalVcardThemeId: body.seasonalVcardThemeId || null,
      },
    });

    if (current && current.name !== name) {
      await tx.branch.updateMany({
        where: { companyId: params.id, companyName: current.name },
        data: { companyName: name },
      });
    }

    const existingBranches = await tx.branch.findMany({
      where: { companyId: params.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        country: true,
        uniqueSlug: true,
        sortOrder: true,
      },
    });

    const principalName = body.baseBranchName || name;
    const principalCity = body.baseCity || body.city || null;
    const principalAddress = body.baseAddress || body.address || null;
    const principalCountry = body.country || 'Honduras';

    if (existingBranches.length > 0) {
      const principal = existingBranches[0];
      await tx.branch.update({
        where: { id: principal.id },
        data: {
          companyId: params.id,
          companyName: name,
          name: principalName,
          city: principalCity,
          address: principalAddress,
          country: principalCountry,
          uniqueSlug: principal.uniqueSlug || slugify(principalName),
        },
      });
    } else {
      await tx.branch.create({
        data: {
          companyId: params.id,
          companyName: name,
          name: principalName,
          city: principalCity,
          address: principalAddress,
          country: principalCountry,
          uniqueSlug: slugify(principalName),
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
          logoUrl: updated.logoUrl,
          vcardThemeId: updated.defaultVcardThemeId,
          seasonalVcardThemeId: updated.seasonalVcardThemeId,
          sortOrder: 0,
        },
      });
    }

    const extraBranches = normalizeBranches(body.branches, name);
    const updatedBranches = await tx.branch.findMany({
      where: { companyId: params.id },
      select: { id: true, uniqueSlug: true, city: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const existingBySlug = new Map(
      updatedBranches
        .filter((branch) => branch.uniqueSlug)
        .map((branch) => [branch.uniqueSlug as string, branch])
    );

    for (let index = 0; index < extraBranches.length; index += 1) {
      const branch = extraBranches[index];
      const sortOrder = index + 1;
      const foundBySlug = existingBySlug.get(branch.uniqueSlug);

      if (foundBySlug) {
        await tx.branch.update({
          where: { id: foundBySlug.id },
          data: {
            companyId: params.id,
            companyName: name,
            name: branch.name,
            city: branch.city,
            address: branch.address,
            country: branch.country,
            uniqueSlug: branch.uniqueSlug,
            primaryColor: updated.primaryColor,
            secondaryColor: updated.secondaryColor,
            logoUrl: updated.logoUrl,
            vcardThemeId: updated.defaultVcardThemeId,
            seasonalVcardThemeId: updated.seasonalVcardThemeId,
            sortOrder,
          },
        });
        continue;
      }

      const foundByCity = updatedBranches.find((candidate) => candidate.city === branch.city && (candidate.sortOrder || 0) > 0);
      if (foundByCity) {
        await tx.branch.update({
          where: { id: foundByCity.id },
          data: {
            companyId: params.id,
            companyName: name,
            name: branch.name,
            city: branch.city,
            address: branch.address,
            country: branch.country,
            uniqueSlug: branch.uniqueSlug,
            primaryColor: updated.primaryColor,
            secondaryColor: updated.secondaryColor,
            logoUrl: updated.logoUrl,
            vcardThemeId: updated.defaultVcardThemeId,
            seasonalVcardThemeId: updated.seasonalVcardThemeId,
            sortOrder,
          },
        });
        continue;
      }

      await tx.branch.create({
        data: {
          companyId: params.id,
          companyName: name,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          country: branch.country,
          uniqueSlug: branch.uniqueSlug,
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
          logoUrl: updated.logoUrl,
          vcardThemeId: updated.defaultVcardThemeId,
          seasonalVcardThemeId: updated.seasonalVcardThemeId,
          sortOrder,
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ company });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'IT', 'SUPER_ADMIN'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: { id: true, _count: { select: { branches: true } } },
  });
  if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
  if (company._count.branches > 0) {
    return NextResponse.json({
      error: 'No se puede borrar la empresa mientras tenga sucursales asociadas.',
      dependencies: { branches: company._count.branches },
    }, { status: 409 });
  }

  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
