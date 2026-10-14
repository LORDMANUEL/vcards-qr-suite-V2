'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Plus, Search, Edit2, Trash2, Palette, Image as ImageIcon } from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    category: string;
    type: string;
    colors: string;
    typography: string | null;
    config: any;
    bgImageUrl: string | null;
    isActive: boolean;
    _count?: {
        portalBranches: number;
        vcardBranches: number;
        legacyBranches: number;
    };
}

interface ThemesGridProps {
    category: 'PORTAL' | 'VCARD' | 'ADMIN';
    title: string;
    subtitle: string;
    createPath: string;
}

export function ThemesGrid({ category, title, subtitle, createPath }: ThemesGridProps) {
    const router = useRouter();
    const { status } = useSession() || {};
    const [themes, setThemes] = useState<Theme[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            loadThemes();
        }
    }, [status, router]);

    const filteredThemes = themes.filter((theme) =>
        theme.category === category &&
        (theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            theme.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const loadThemes = async () => {
        try {
            const res = await fetch(`/api/themes?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setThemes(data.themes || []);
            }
        } catch (error) {
            console.error('Error loading themes:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseColors = (colorsString: string) => {
        try {
            return JSON.parse(colorsString);
        } catch {
            return { primary: '#003478', secondary: '#FFFFFF', accent: '#10B981' };
        }
    };

    const getEditPath = (themeId: string) => {
        if (category === 'PORTAL') return `/temas-portal/editor/${themeId}`;
        if (category === 'VCARD') return `/temas/${themeId}`;
        return `/temas/${themeId}`;
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este tema?')) return;

        try {
            const res = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadThemes();
            } else {
                alert('Error al eliminar el tema. Puede que esté asignado a una sucursal.');
            }
        } catch (error) {
            console.error('Error deleting theme:', error);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex h-screen bg-gray-50 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title={title} subtitle={subtitle} />
                <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {/* Header Action Bar */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#003478] to-[#0056b3] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Palette className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Biblioteca de Temas</h2>
                                    <p className="text-sm text-gray-500 font-medium">Gestionar diseños de la categoría: {category}</p>
                                </div>
                            </div>

                            <div className="flex w-full sm:w-auto gap-3">
                                <div className="relative flex-1 sm:w-80">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar por nombre del tema..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#003478] transition-all text-sm font-semibold"
                                    />
                                </div>
                                <button
                                    onClick={() => router.push(createPath)}
                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-2xl shadow-xl shadow-blue-100 transition-all font-bold whitespace-nowrap active:scale-95"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span>CREAR TEMA</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Graphical Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredThemes.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                <Palette className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">No se encontraron temas en esta categoría</h3>
                                <p className="text-gray-400 mt-2">Prueba creando uno nuevo con el botón superior</p>
                            </div>
                        ) : (
                            filteredThemes.map((theme) => {
                                const colors = parseColors(theme.colors);
                                const branchesUsing = (theme._count?.portalBranches || 0) + (theme._count?.vcardBranches || 0) + (theme._count?.legacyBranches || 0);

                                return (
                                    <div
                                        key={theme.id}
                                        className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col h-full active:scale-[0.98]"
                                    >
                                        {/* Header Preview Clip */}
                                        <div className="relative h-44 overflow-hidden">
                                            <div className="absolute inset-0 bg-gray-100">
                                                {theme.bgImageUrl ? (
                                                    <img
                                                        src={theme.bgImageUrl}
                                                        alt={theme.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                                        <ImageIcon className="w-12 h-12 text-gray-200" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4 z-20">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${theme.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${theme.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                    {theme.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </div>

                                            {/* Floating Category Icon */}
                                            <div className="absolute top-4 left-4 z-20">
                                                <div className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center border border-white">
                                                    <Palette className="w-5 h-5 text-gray-700" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta Section */}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-[#003478] transition-colors">
                                                {theme.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">
                                                {theme.type === 'FESTIVE' ? 'Diseño temático para festividades.' : theme.type === 'CORPORATE' ? 'Identidad visual institucional.' : 'Diseño estacional dinámico.'}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colors.primary }} />
                                                    <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colors.secondary }} />
                                                    <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colors.accent || '#10B981' }} />
                                                </div>
                                                <div className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg uppercase">
                                                    {branchesUsing} ASIGNACIONES
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions Footer */}
                                        <div className="px-3 py-3 bg-gray-50 flex gap-2">
                                            <button
                                                onClick={() => router.push(getEditPath(theme.id))}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-gray-700 hover:text-[#003478] font-bold text-xs rounded-xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all active:scale-95"
                                            >
                                                <Edit2 className="w-4 h-4" /> REVISAR
                                            </button>
                                            <button
                                                onClick={() => handleDelete(theme.id)}
                                                className="w-12 h-12 flex items-center justify-center bg-white text-red-500 hover:bg-red-50 rounded-xl shadow-sm border border-red-50 transition-all active:scale-95"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
