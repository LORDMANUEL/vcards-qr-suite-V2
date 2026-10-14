'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThemeEditor } from '../../components/ThemeEditor';

function NuevoTemaContent() {
    const searchParams = useSearchParams();
    const category = (searchParams.get('category') as 'PORTAL' | 'VCARD') || 'PORTAL';

    return <ThemeEditor mode="create" category={category} />;
}

export default function NuevoTemaPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
            </div>
        }>
            <NuevoTemaContent />
        </Suspense>
    );
}
