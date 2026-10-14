import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import ClientVCardPage from './client-page';

async function getVCardData(id: string) {
  const vcard = await prisma.vCard.findFirst({
    where: { qrCodeData: id },
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
          companyName: true,
          company: {
            include: {
              defaultVcardTheme: true,
              seasonalVcardTheme: true,
            },
          },
          name: true,
          address: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          theme: true,
          vcardTheme: true,
          seasonalVcardTheme: true,
          vcardPositionThemeRules: {
            include: {
              theme: true,
            },
            orderBy: { positionGroup: 'asc' },
          },
        },
      },
    },
  });

  if (!vcard) {
    return null;
  }

  const activeGlobalTheme = await prisma.theme.findFirst({
    where: { category: 'VCARD', isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  return JSON.parse(JSON.stringify({ vcard, activeGlobalTheme }));
}

export default async function PublicVCardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { sig?: string };
}) {
  const { id } = params;
  const data = await getVCardData(id);
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div></div>}><ClientVCardPage initialData={data} vCardId={id} /></Suspense>;
}