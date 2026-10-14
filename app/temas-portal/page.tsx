'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import {
    Plus, Palette, Eye, Edit2, Trash2, CheckCircle,
    Globe, Wifi, ShieldCheck, Clock, Star, MoreVertical
} from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    isActive: boolean;
    colors: string | null;
    config: any;
    createdAt: string;
    updatedAt: string;
}

interface Branch {
    id: string;
    name: string;
    city?: string | null;
    portalThemeId?: string | null;
}

interface AccessPoint {
    id: string;
    name: string;
    branchId: string;
    themeId?: string | null;
    activeSessions?: number;
}

function TemasPortalContent() {
    const router = useRouter();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState<string | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
    const [assignTheme, setAssignTheme] = useState<Theme | null>(null);
    const [assignTarget, setAssignTarget] = useState<'global' | `branch:${string}` | `ap:${string}`>('global');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [themesRes, branchesRes, apsRes] = await Promise.all([
                fetch('/api/themes?category=PORTAL'),
                fetch('/api/branches'),
                fetch('/api/access-points'),
            ]);

            if (themesRes.ok) {
                const data = await themesRes.json();
                setThemes(data.themes || []);
            }
            if (branchesRes.ok) {
                const data = await branchesRes.json();
                setBranches(data.branches || []);
            }
            if (apsRes.ok) {
                const data = await apsRes.json();
                setAccessPoints(data.accessPoints || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!assignTheme) return;
        setActivating(assignTheme.id);
        try {
            if (assignTarget === 'global') {
                await fetch(`/api/themes/${assignTheme.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: true }),
                });
            } else if (assignTarget.startsWith('branch:')) {
                const branchId = assignTarget.replace('branch:', '');
                await fetch(`/api/branches/${branchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ portalThemeId: assignTheme.id }),
                });
            } else if (assignTarget.startsWith('ap:')) {
                const apId = assignTarget.replace('ap:', '');
                await fetch(`/api/access-points/${apId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ themeId: assignTheme.id }),
                });
            }
            setAssignTheme(null);
            setAssignTarget('global');
            await fetchData();
        } finally {
            setActivating(null);
        }
    };

    const handleDelete = async (themeId: string) => {
        if (!confirm('¿Eliminar este tema?')) return;
        await fetch(`/api/themes/${themeId}`, { method: 'DELETE' });
        await fetchData();
    };

    const getUsage = (themeId: string) => {
        const branchUsage = branches.filter((branch) => branch.portalThemeId === themeId).length;
        const apUsage = accessPoints.filter((ap) => ap.themeId === themeId).length;
        return { branchUsage, apUsage };
    };

    const parseColors = (colorsStr: string | null) => {
        try { return colorsStr ? JSON.parse(colorsStr) : null; } catch { return null; }
    };

    const PORTAL_PAGES = [
        { icon: Globe, label: 'Acceso', color: '#3b82f6' },
        { icon: ShieldCheck, label: 'Garantizado', color: '#10b981' },
        { icon: Wifi, label: 'Internet', color: '#8b5cf6' },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title="Temas Portales Cautivos" subtitle="Diseña las 3 páginas públicas de acceso a internet" />
                <main className="flex-1 overflow-y-auto p-8">

                    {/* Header with Create Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-sm text-gray-500 mt-1">
                                Edita el diseño de: <span className="font-bold text-blue-600">Portal Acceso</span>,{' '}
                                <span className="font-bold text-emerald-600">Acceso Garantizado</span> y{' '}
                                <span className="font-bold text-purple-600">Estado de Internet</span>
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/temas-portal/editor')}
                            className="flex items-center gap-2 px-6 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-2xl shadow-lg shadow-blue-100 transition-all font-bold text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Crear Tema
                        </button>
                    </div>

                    {/* Info Cards for the 3 pages */}
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        {PORTAL_PAGES.map(({ icon: Icon, label, color }) => (
                            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Página</p>
                                    <p className="font-bold text-gray-800">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Themes Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#003478] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : themes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
                                <Palette className="w-10 h-10 text-[#003478]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin temas creados</h3>
                            <p className="text-gray-500 mb-6">Crea tu primer tema visual para los portales cautivos</p>
                                <button
                                    onClick={() => router.push('/temas-portal/editor')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#003478] text-white rounded-2xl font-bold text-sm hover:bg-[#002557] transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Crear Primer Tema
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {themes.map(theme => {
                                const colors = parseColors(theme.colors);
                                const primary = colors?.primary || '#003478';
                                const accent = colors?.accent || '#10b981';

                                return (
                                    <div key={theme.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                                        {/* Preview Header */}
                                        <div className="h-28 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg">
                                                    <div className="w-24 h-2 rounded-full mb-2" style={{ backgroundColor: primary }} />
                                                    <div className="w-16 h-1.5 rounded-full bg-gray-200 mb-2" />
                                                    <div className="w-20 h-4 rounded-lg" style={{ backgroundColor: accent }} />
                                                </div>
                                            </div>
                                            {theme.isActive && (
                                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                                                    <CheckCircle className="w-3 h-3" /> ACTIVO
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-gray-900">{theme.name}</h3>
                                                <div className="flex gap-1">
                                                    {[primary, accent, colors?.secondary || '#fff'].map((c, i) => (
                                                        <div key={i} className="w-4 h-4 rounded-full border border-gray-100" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(theme.updatedAt).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>

                                            {/* 3-page indicators */}
                                            <div className="flex gap-1.5 mb-4">
                                                {PORTAL_PAGES.map(({ label, color }) => (
                                                    <span key={label} className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '15', color }}>
                                                        {label.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.push(`/temas-portal/editor/${theme.id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Editar
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/temas-portal/editor/${theme.id}`)}
                                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-blue-50 rounded-xl text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                {!theme.isActive && (
                                                    <button
                                                        onClick={() => { setAssignTheme(theme); setAssignTarget('global'); }}
                                                        disabled={activating === theme.id}
                                                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Star className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(theme.id)}
                                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 text-[11px] text-gray-500">
                                                <div>
                                                    <p className="font-black uppercase tracking-widest text-gray-400">Sucursales usando</p>
                                                    <p className="mt-1 text-base font-black text-gray-800">{getUsage(theme.id).branchUsage}</p>
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-widest text-gray-400">AP overrides</p>
                                                    <p className="mt-1 text-base font-black text-gray-800">{getUsage(theme.id).apUsage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {assignTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
                            <div>
                                <h3 className="text-xl font-black text-[#003478]">Asignar tema portal</h3>
                                <p className="text-xs text-gray-500">{assignTheme.name}</p>
                            </div>
                            <button onClick={() => setAssignTheme(null)} className="rounded-full p-2 hover:bg-gray-100"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <div className="space-y-4 p-8">
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Aplicar a</label>
                                <select value={assignTarget} onChange={(e) => setAssignTarget(e.target.value as any)} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]">
                                    <option value="global">Tema global por defecto</option>
                                    {branches.map((branch) => (
                                        <option key={`branch-${branch.id}`} value={`branch:${branch.id}`}>Sucursal: {branch.city || branch.name}</option>
                                    ))}
                                    {accessPoints.map((ap) => (
                                        <option key={`ap-${ap.id}`} value={`ap:${ap.id}`}>AP: {ap.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="rounded-2xl bg-blue-50 p-4 text-xs text-blue-700">
                                Si eliges global, este tema desactiva al portal global anterior. Si eliges sucursal o AP, se aplica como override visual para ese destino.
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F8FAFC] px-8 py-6">
                            <button onClick={() => setAssignTheme(null)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cancelar</button>
                            <button onClick={handleActivate} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">Aplicar tema</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TemasPortalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <TemasPortalContent />
        </Suspense>
    );
}
