'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PortalStudioEditor = dynamic(() => import('./PortalStudioEditor').then(mod => ({ default: mod.default })), {
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

export default function PortalThemeCreateEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#003478] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#003478] font-bold">Cargando editor...</p>
        </div>
      </div>
    }>
      <PortalStudioEditor />
    </Suspense>
  );
}
