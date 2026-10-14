'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DesignerRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    router.replace(id ? `/vcards/editor?id=${id}` : '/vcards/editor');
  }, [router, searchParams]);

  return <div className="flex h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Abriendo editor premium de tarjetas...</div>;
}

export default function VCardDesignerPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <DesignerRedirect />
    </Suspense>
  );
}
