'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { isValidThemeDateRange } from '@/lib/vcard-theme-calendar';
import { themeRuntimeLayout } from '@/lib/vcard-theme-format';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { VCardsGuidedTour } from '../../components/vcards-guided-tour';
import {
    Plus, Palette, Eye, Edit2, Trash2, CheckCircle,
    Clock, Star, LayoutTemplate, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    isActive: boolean;
    colors: string | null;
    config: any;
    updatedAt: string;
    type?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
}

interface Company { id: string; name: string; }
interface Branch {
    companyId?: string | null;
    id: string;
    name: string;
    city?: string | null;
    companyName?: string | null;
}

function VCardTemasContent() {
    const router = useRouter();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activationError, setActivationError] = useState('');
    const [catalogError, setCatalogError] = useState('');
    const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scheduleTheme, setScheduleTheme] = useState<Theme | null>(null);
    const [scheduleForm, setScheduleForm] = useState({ validFrom: '', validTo: '', type: 'SEASONAL' });
    const [activateTheme, setActivateTheme] = useState<Theme | null>(null);
    const [activationTarget, setActivationTarget] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    useEffect(() => {
        fetchThemes();
        fetch('/api/branches').then(r => r.json()).then((data) => setBranches(data.branches || [])).catch(console.error);
        fetch('/api/companies').then(r => r.json()).then((data) => setCompanies(data.companies || [])).catch(console.error);
    }, []);

    const fetchThemes = async () => {
        try {
            const res = await fetch('/api/vcard-themes');
            if (res.ok) {
                const data = await res.json();
                setThemes(data.themes || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (deletingThemeId) return;
        if (!confirm('¿Eliminar este tema? Solo se permiten borradores sin referencias en empresas, sucursales, puestos ni portales.')) return;
        setCatalogError('');
        setDeletingThemeId(id);
        try {
            const response = await fetch(`/api/vcard-themes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'No se pudo eliminar el tema');
            await fetchThemes();
        } catch (error) {
            setCatalogError(error instanceof Error ? error.message : 'No se pudo eliminar el tema');
        } finally {
            setDeletingThemeId(null);
        }
    };

    const handleActivate = async () => {
        if (!activateTheme || publishing) return;
        const [scope, targetId] = activationTarget.split(':');
        if ((scope !== 'company' && scope !== 'branch') || !targetId) {
            setActivationError('Seleccione una empresa o sucursal.');
            return;
        }
        setPublishing(true);
        setActivationError('');
        try {
            const res = await fetch('/api/vcard-themes/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeId: activateTheme.id, scope, targetId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'No se pudo publicar');
            setActivateTheme(null);
            setActivationTarget('');
            await fetchThemes();
        } catch (error) {
            setActivationError(error instanceof Error ? error.message : 'Error de publicación');
        } finally {
            setPublishing(false);
        }
    };

    const openActivate = (theme: Theme) => {
        setActivateTheme(theme);
        setActivationTarget('');
        setActivationError('');
    };

    const handleClone = async (theme: Theme) => {
        const res = await fetch('/api/vcard-themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cloneThemeId: theme.id, name: `${theme.name} copia`, type: theme.type, validFrom: theme.validFrom, validTo: theme.validTo }),
        });
        if (res.ok) await fetchThemes();
    };

    const openSchedule = (theme: Theme) => {
        setScheduleTheme(theme);
        const anchorDate = theme.validFrom ? new Date(`${String(theme.validFrom).slice(0, 10)}T12:00:00`) : new Date();
        setCalendarMonth(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
        setScheduleForm({
            validFrom: theme.validFrom ? String(theme.validFrom).slice(0, 10) : '',
            validTo: theme.validTo ? String(theme.validTo).slice(0, 10) : '',
            type: theme.type || 'SEASONAL',
        });
    };

    const saveSchedule = async () => {
        if (!scheduleTheme) return;
        if (!isValidThemeDateRange(scheduleForm.validFrom, scheduleForm.validTo)) {
            alert('La fecha final no puede ser anterior a la inicial.');
            return;
        }
        try {
            const response = await fetch('/api/vcard-themes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: scheduleTheme.id, type: scheduleForm.type, validFrom: scheduleForm.validFrom || null, validTo: scheduleForm.validTo || null }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.error || 'No se pudo programar el tema');
            setScheduleTheme(null);
            await fetchThemes();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al programar');
        }
    };

    const applyPreset = (preset: 'today' | 'weekend' | 'month') => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);
        if (preset === 'today') {
            end.setDate(start.getDate());
        } else if (preset === 'weekend') {
            const day = now.getDay();
            const daysUntilSaturday = (6 - day + 7) % 7;
            start.setDate(now.getDate() + daysUntilSaturday);
            end.setDate(start.getDate() + 1);
        } else {
            end.setMonth(start.getMonth() + 1);
            end.setDate(start.getDate() - 1);
        }
        setScheduleForm({
            ...scheduleForm,
            type: 'SEASONAL',
            validFrom: start.toISOString().slice(0, 10),
            validTo: end.toISOString().slice(0, 10),
        });
    };

    const parseColors = (s: string | null) => {
        try { return s ? JSON.parse(s) : null; } catch { return null; }
    };

    const buildCalendarDays = () => {
        const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const firstWeekDay = (start.getDay() + 6) % 7;
        const gridStart = new Date(start);
        gridStart.setDate(start.getDate() - firstWeekDay);
        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);
            return date;
        });
    };

    const calendarDays = buildCalendarDays();
    const rangeStart = scheduleForm.validFrom ? new Date(scheduleForm.validFrom) : null;
    const rangeEnd = scheduleForm.validTo ? new Date(scheduleForm.validTo) : rangeStart;

    const isInRange = (date: Date) => {
        if (!rangeStart || !rangeEnd) return false;
        const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const from = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()).getTime();
        const to = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()).getTime();
        return current >= Math.min(from, to) && current <= Math.max(from, to);
    };

    const isBoundary = (date: Date) => {
        if (!rangeStart) return false;
        const current = date.toISOString().slice(0, 10);
        return current === scheduleForm.validFrom || current === scheduleForm.validTo;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title="Publicación de temas vCard" subtitle="El diseño se crea en Theme Builder. Aquí solamente se organiza, programa y publica por empresa o sucursal." />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-sm text-gray-500">Cada tema define el diseño que verá el cliente al escanear el código QR de la tarjeta</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push('/vcards')}
                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-sm hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-4 h-4" /> Volver a vCards
                            </button>
                            <button
                                onClick={() => router.push('/vcards/theme-builder')}
                                data-tour-id="temas-create"
                                className="flex items-center gap-2 px-6 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" /> Diseñar tema
                            </button>
                        </div>
                    </div>

                    {catalogError && (
                        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            <strong>El tema no se eliminó.</strong> {catalogError}
                            <button type="button" onClick={() => setCatalogError('')} className="ml-3 underline">Cerrar</button>
                        </div>
                    )}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#003478] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : themes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <LayoutTemplate className="w-10 h-10 text-[#003478]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin temas vCard</h3>
                            <p className="text-gray-500 mb-6">Diseñe su primera plantilla en Theme Builder y luego publíquela aquí</p>
                            <button onClick={() => router.push('/vcards/theme-builder')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#003478] text-white rounded-2xl font-bold hover:bg-[#002557]">
                                <Plus className="w-4 h-4" /> Diseñar tema
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {themes.map(theme => {
                                const colors = parseColors(theme.colors);
                                const primary = colors?.primary || '#003478';
                                const accent = colors?.accent || '#10b981';
                                const blocks = themeRuntimeLayout(theme.config);
                                return (
                                    <div key={theme.id} data-tour-id="temas-card" className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                                        {/* Preview */}
                                        <div className="h-32 relative flex items-center justify-center"
                                            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}aa)` }}>
                                            <div className="bg-white/90 rounded-2xl px-4 py-3 shadow-lg w-36">
                                                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center" style={{ backgroundColor: accent + '22' }}>
                                                    <Palette className="w-5 h-5" style={{ color: accent }} />
                                                </div>
                                                <div className="h-2 rounded-full w-full mb-1" style={{ backgroundColor: primary }} />
                                                <div className="h-1.5 rounded-full w-3/4 bg-gray-200" />
                                            </div>
                                            {theme.isActive && (
                                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full">
                                                    <CheckCircle className="w-3 h-3" /> ACTIVO
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 left-3 text-[9px] text-white/70 font-bold uppercase tracking-widest">
                                                {blocks.length} bloque{blocks.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-gray-900 truncate">{theme.name}</h3>
                                                <div className="flex gap-1 shrink-0">
                                                    {[primary, accent].map((c, i) => (
                                                        <div key={i} className="w-4 h-4 rounded-full border border-gray-100" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(theme.updatedAt).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            <div className="mb-4 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500">
                                                <p><span className="font-black uppercase tracking-widest text-gray-400">Tipo:</span> {theme.type || 'CORPORATE'}</p>
                                                <p className="mt-1"><span className="font-black uppercase tracking-widest text-gray-400">Calendario:</span> {theme.validFrom ? new Date(theme.validFrom).toLocaleDateString('es-HN') : 'Sin inicio'} - {theme.validTo ? new Date(theme.validTo).toLocaleDateString('es-HN') : 'Sin fin'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.push(`/vcards/theme-builder?themeId=${theme.id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" /> Abrir diseñador
                                                </button>
                                                {(
                                                    <button onClick={() => openActivate(theme)} data-tour-id="temas-activate"
                                                        className="flex items-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 transition-colors">
                                                        <Star className="w-3.5 h-3.5" /> Publicar
                                                    </button>
                                                )}
                                                <button onClick={() => handleClone(theme)}
                                                    className="flex items-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-700 transition-colors">
                                                    <Plus className="w-3.5 h-3.5" /> Clonar
                                                </button>
                                                <button onClick={() => openSchedule(theme)}
                                                    className="flex items-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-700 transition-colors">
                                                    <Clock className="w-3.5 h-3.5" /> Fechas
                                                </button>
                                                <button onClick={() => handleDelete(theme.id)}
                                                    className="flex items-center py-2 px-3 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold text-red-600 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                <VCardsGuidedTour
                    tourId="temas-v1"
                    title="Guia de Temas"
                    steps={[
                        {
                            id: 'temas-create-step',
                            selector: '[data-tour-id="temas-create"]',
                            title: 'Crear tema nuevo',
                            description: 'Aqui diseñas un tema para que la vCard del cliente se vea mas atractiva.',
                        },
                        {
                            id: 'temas-card-step',
                            selector: '[data-tour-id="temas-card"]',
                            title: 'Vista de cada tema',
                            description: 'Cada tarjeta muestra colores, tipo y fecha para elegir rapido.',
                        },
                        {
                            id: 'temas-activate-step',
                            selector: '[data-tour-id="temas-activate"]',
                            title: 'Activar tema',
                            description: 'Con Activar aplicas el tema al alcance elegido y personalizas la experiencia.',
                        },
                    ]}
                />
            </div>

            {scheduleTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-xl rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
                            <div>
                                <h3 className="text-xl font-black text-[#003478]">Calendario del tema</h3>
                                <p className="text-xs text-gray-500">{scheduleTheme.name}</p>
                            </div>
                            <button onClick={() => setScheduleTheme(null)} className="rounded-full p-2 hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2">
                            <select value={scheduleForm.type} onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2">
                                <option value="CORPORATE">Corporativo</option>
                                <option value="SEASONAL">Temporada</option>
                                <option value="FESTIVE">Solo por fecha especial</option>
                            </select>
                            <div className="md:col-span-2 rounded-[24px] border border-gray-200 bg-[#f8fafc] p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Calendario visual</p>
                                        <h4 className="text-lg font-black text-[#003478]">{calendarMonth.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#003478]"><ChevronLeft className="w-4 h-4" /></button>
                                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#003478]"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => <div key={day}>{day}</div>)}
                                </div>
                                <div className="mt-3 grid grid-cols-7 gap-2">
                                    {calendarDays.map((date) => {
                                        const inCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                                        const inRange = isInRange(date);
                                        const boundary = isBoundary(date);
                                        const isoDate = date.toISOString().slice(0, 10);
                                        return (
                                            <button
                                                key={isoDate}
                                                onClick={() => {
                                                    if (!scheduleForm.validFrom || (scheduleForm.validFrom && scheduleForm.validTo)) {
                                                        setScheduleForm({ ...scheduleForm, validFrom: isoDate, validTo: '' });
                                                    } else {
                                                        setScheduleForm({ ...scheduleForm, validTo: isoDate });
                                                    }
                                                }}
                                                className={`aspect-square rounded-2xl border text-sm font-bold transition ${boundary ? 'border-[#003478] bg-[#003478] text-white shadow-lg shadow-blue-100' : inRange ? 'border-blue-200 bg-blue-50 text-[#003478]' : 'border-gray-200 bg-white text-gray-700'} ${!inCurrentMonth ? 'opacity-35' : ''}`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex flex-wrap gap-2">
                                <button onClick={() => applyPreset('today')} className="rounded-xl bg-gray-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600">Solo hoy</button>
                                <button onClick={() => applyPreset('weekend')} className="rounded-xl bg-gray-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600">Proximo fin</button>
                                <button onClick={() => applyPreset('month')} className="rounded-xl bg-gray-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600">Proximo mes</button>
                            </div>
                            <input type="date" value={scheduleForm.validFrom} onChange={(e) => setScheduleForm({ ...scheduleForm, validFrom: e.target.value })} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                            <input type="date" value={scheduleForm.validTo} onChange={(e) => setScheduleForm({ ...scheduleForm, validTo: e.target.value })} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F8FAFC] px-8 py-6">
                            <button onClick={() => setScheduleTheme(null)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cancelar</button>
                            <button onClick={saveSchedule} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">Guardar calendario</button>
                        </div>
                    </div>
                </div>
            )}

            {activateTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
                            <div>
                                <h3 className="text-xl font-black text-[#003478]">Publicar tema</h3>
                                <p className="text-xs text-gray-500">{activateTheme.name}</p>
                            </div>
                            <button onClick={() => setActivateTheme(null)} className="rounded-full p-2 hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Aplicar a</label>
                                <select value={activationTarget} onChange={(e) => setActivationTarget(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]">
                                    <option value="">Seleccione el destino</option>
                                     {companies.map((company) => (
                                         <optgroup key={company.id} label={company.name}>
                                             <option value={`company:${company.id}`}>Toda la empresa: {company.name}</option>
                                             {branches.filter((br) => br.companyId === company.id).map((br) => (
                                                 <option key={br.id} value={`branch:${br.id}`}>Sucursal: {br.name}{br.city ? ` (${br.city})` : ''}</option>
                                             ))}
                                         </optgroup>
                                     ))}
                                 </select>
                            </div>
                            <p className="rounded-2xl bg-blue-50 p-4 text-xs text-blue-700">Se publica solo para la empresa o sucursal elegida. Las demás compañías mantienen su diseño independiente.</p>
                             {activationError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{activationError}</p>}
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F8FAFC] px-8 py-6">
                            <button onClick={() => setActivateTheme(null)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cancelar</button>
                            <button onClick={handleActivate} disabled={publishing || !activationTarget} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">{publishing ? 'Publicando...' : 'Publicar tema'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function VCardTemasPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <VCardTemasContent />
        </Suspense>
    );
}
