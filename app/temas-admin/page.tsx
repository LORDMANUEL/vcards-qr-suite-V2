'use client';

import { Suspense } from 'react';
import { ThemesGrid } from '../components/ThemesGrid';

export default function TemasAdminPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
            <ThemesGrid
                category="ADMIN"
                title="Diseño Administrativo"
                subtitle="Personalización del backend y reportería general"
                createPath="/temas/nuevo?category=ADMIN"
            />
        </Suspense>
    );
}
