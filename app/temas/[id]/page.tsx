'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ThemeEditor } from '../../components/ThemeEditor';

export default function EditarTemaPage() {
    const params = useParams();
    const router = useRouter();
    const { status } = useSession() || {};
    const [theme, setTheme] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && params.id) {
            loadTheme();
        }
    }, [status, params.id, router]);

    const loadTheme = async () => {
        try {
            const res = await fetch(`/api/themes/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setTheme(data.theme);
            } else {
                router.push('/temas');
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            router.push('/temas');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !theme) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
            </div>
        );
    }

    return <ThemeEditor mode="edit" themeId={params.id as string} initialData={theme} category={theme.category} />;
}
