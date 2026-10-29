import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { verifyVCardSignature } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };
import ClientVCardPage from './client-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getVCardData(id: string) {
  const vcard = await prisma.vCard.findFirst({
    where: { qrCodeData: id, isActive: true, user: { isActive: true } },
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
    where: { category: 'VCARD', isActive: true, companyId: null },
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
  // Same signature policy as V2: REQUIRE_VCARD_SIGNATURE controls legacy unsigned QR support.
  if (!verifyVCardSignature(id, searchParams?.sig)) notFound();
  const data = await getVCardData(id);
  if (!data) notFound();
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div></div>}><ClientVCardPage initialData={data} vCardId={id} /></Suspense>;
}