'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const PortalStudioEditor = dynamic(() => import('../PortalStudioEditor').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#003478] border-t-transparent mx-auto mb-4"></div>
        <p className="text-[#003478] font-bold">Cargando Studio Canvas...</p>
      </div>
    </div>
  ),
});

export default function PortalThemeEditPage() {
  const params = useParams();
  const themeId = String(params?.id || '');

  if (!themeId) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-sm font-bold text-gray-500">Tema invalido</div>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50 text-sm font-bold text-gray-500">Cargando tema portal...</div>}>
      <PortalStudioEditor initialThemeId={themeId} />
    </Suspense>
  );
}
