'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Image as ImageIcon, ArrowLeft, Save, Code, Eye } from 'lucide-react';

interface ThemeEditorProps {
    initialData?: any;
    mode: 'create' | 'edit';
    themeId?: string;
    category: 'PORTAL' | 'VCARD' | 'ADMIN';
    noCode?: boolean;
}

export function ThemeEditor({ initialData, mode, themeId, category, noCode = false }: ThemeEditorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'builder'>('visual');

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        category: category,
        type: initialData?.type || 'CORPORATE',
        primary: initialData?.colors ? JSON.parse(initialData.colors).primary : '#003478',
        secondary: initialData?.colors ? JSON.parse(initialData.colors).secondary : '#FFFFFF',
        accent: initialData?.colors ? JSON.parse(initialData.colors).accent : '#10B981',
        typography: initialData?.typography || 'Inter',
        bgImageUrl: initialData?.bgImageUrl || '',
        htmlTemplate: initialData?.htmlTemplate || '',
        cssCustom: initialData?.cssCustom || '',
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        canvasConfig: initialData?.config || {
            blur: 0,
            opacity: 100,
            gradient: false,
            gradientColor: '#000000',
            rounded: 'xl',
            borderWidth: 1
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = mode === 'edit' ? `/api/themes/${themeId}` : '/api/themes';
            const method = mode === 'edit' ? 'PUT' : 'POST';

            const payload = {
                name: formData.name,
                category: formData.category,
                type: formData.type,
                typography: formData.typography,
                colors: JSON.stringify({
                    primary: formData.primary,
                    secondary: formData.secondary,
                    accent: formData.accent
                }),
                config: formData.canvasConfig,
                htmlTemplate: formData.htmlTemplate,
                cssCustom: formData.cssCustom,
                bgImageUrl: formData.bgImageUrl || null,
                isActive: formData.isActive
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (category === 'PORTAL') router.push('/temas-portal');
                else if (category === 'VCARD') router.push('/vcards/temas');
                else if (category === 'ADMIN') router.push('/temas-admin');
                else router.push('/temas');
            } else {
                alert('Error al guardar el tema');
            }
        } catch (error) {
            console.error('Error saving theme:', error);
            alert('Error en el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Top Header */}
            <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-none">
                            {mode === 'edit' ? 'Editando Tema Builder' : 'Nuevo Diseño Builder'}
                        </h1>
                        <p className="text-[10px] font-bold text-[#003478] uppercase tracking-widest mt-1">
                            Categoría: {category}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl mr-auto ml-10">
                    <button
                        onClick={() => setActiveTab('visual')}
                        type="button"
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'visual' ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Eye className="w-4 h-4" /> Estética UI
                    </button>
                    {!noCode && (
                        <button
                            onClick={() => setActiveTab('builder')}
                            type="button"
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'builder' ? 'bg-[#003478] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Code className="w-4 h-4" /> Builder HTML/CSS
                        </button>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-2xl shadow-xl shadow-blue-100 transition-all font-bold disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    <span>{mode === 'edit' ? 'GUARDAR LAYOUT' : 'PUBLICAR LAYOUT'}</span>
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Visual Editor Mode */}
                {activeTab === 'visual' && (
                    <>
                        {/* Controls Panel */}
                        <div className="w-[450px] border-r border-gray-100 overflow-y-auto p-8 scrollbar-hide">
                            <form className="space-y-8">
                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Información General</label>
                                    <div className="space-y-4">
                                        <input
                                            type="text" required value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] focus:bg-white transition-all outline-none font-bold text-[#003478]"
                                            placeholder="Nombre identificativo del tema..."
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-gray-400 ml-1">Tipo de Estética</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full p-3 bg-gray-50 border border-transparent rounded-xl outline-none font-bold text-xs"
                                                >
                                                    <option value="CORPORATE">Corporativo</option>
                                                    <option value="FESTIVE">Festivo</option>
                                                    <option value="SEASONAL">Estacional</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-gray-400 ml-1">Estado Inicial</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                    className={`w-full p-3 rounded-xl font-bold text-xs border transition-all ${formData.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                                        }`}
                                                >
                                                    {formData.isActive ? 'ACTIVO' : 'BORRADOR'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-8 border-t border-gray-50">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Capas Visuales & Canvas</label>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-[11px] font-bold text-gray-700">Desenfoque (Blur)</label>
                                                <span className="text-[10px] font-black text-[#003478]">{formData.canvasConfig.blur}px</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="25"
                                                value={formData.canvasConfig.blur}
                                                onChange={e => setFormData({ ...formData, canvasConfig: { ...formData.canvasConfig, blur: parseInt(e.target.value) } })}
                                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003478]"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-[11px] font-bold text-gray-700">Opacidad del Vidrio</label>
                                                <span className="text-[10px] font-black text-[#003478]">{formData.canvasConfig.opacity}%</span>
                                            </div>
                                            <input
                                                type="range" min="10" max="100"
                                                value={formData.canvasConfig.opacity}
                                                onChange={e => setFormData({ ...formData, canvasConfig: { ...formData.canvasConfig, opacity: parseInt(e.target.value) } })}
                                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003478]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-700">Radio de Bordes</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['md', 'xl', 'full'].map(r => (
                                                    <button
                                                        key={r} type="button"
                                                        onClick={() => setFormData({ ...formData, canvasConfig: { ...formData.canvasConfig, rounded: r } })}
                                                        className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${formData.canvasConfig.rounded === r ? 'bg-[#003478] border-[#003478] text-white shadow-md' : 'bg-gray-50 border-transparent text-gray-400'
                                                            }`}
                                                    >
                                                        {r.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${formData.canvasConfig.gradient ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
                                                <span className="text-xs font-bold text-gray-700">Degradado de Suelo</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.canvasConfig.gradient}
                                                onChange={e => setFormData({ ...formData, canvasConfig: { ...formData.canvasConfig, gradient: e.target.checked } })}
                                                className="w-5 h-5 rounded-md border-gray-300 text-[#003478] focus:ring-[#003478]"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-8 border-t border-gray-50">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Paleta de Colores</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="w-full aspect-square rounded-2xl border-2 border-gray-100 relative overflow-hidden shadow-sm" style={{ backgroundColor: formData.primary }}>
                                                <input type="color" value={formData.primary} onChange={e => setFormData({ ...formData, primary: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </div>
                                            <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-tighter">Primario</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-full aspect-square rounded-2xl border-2 border-gray-100 relative overflow-hidden shadow-sm" style={{ backgroundColor: formData.accent }}>
                                                <input type="color" value={formData.accent} onChange={e => setFormData({ ...formData, accent: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </div>
                                            <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-tighter">Acento</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-full aspect-square rounded-2xl border-2 border-gray-100 relative overflow-hidden shadow-sm" style={{ backgroundColor: formData.secondary }}>
                                                <input type="color" value={formData.secondary} onChange={e => setFormData({ ...formData, secondary: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </div>
                                            <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-tighter">Secundario</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-8 border-t border-gray-50 pb-10">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Fondo de Pantalla (Hero)</label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text" value={formData.bgImageUrl}
                                            onChange={e => setFormData({ ...formData, bgImageUrl: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#003478]"
                                            placeholder="Pegar URL de Unsplash, Google Storage..."
                                        />
                                    </div>
                                </section>
                            </form>
                        </div>

                        {/* Live Preview Canvas */}
                        <div className="flex-1 bg-gray-50 flex items-center justify-center p-20 relative">
                            <div className="absolute inset-0 z-0">
                                <div className="w-full h-full relative">
                                    {formData.bgImageUrl ? (
                                        <img src={formData.bgImageUrl} className="w-full h-full object-cover" alt="Preview bg" />
                                    ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: formData.primary }} />
                                    )}
                                    <div
                                        className="absolute inset-0 backdrop-blur-sm"
                                        style={{ backdropFilter: `blur(${formData.canvasConfig.blur}px)` }}
                                    />
                                    {formData.canvasConfig.gradient && (
                                        <div
                                            className="absolute inset-0"
                                            style={{ background: `linear-gradient(to bottom, transparent, ${formData.canvasConfig.gradientColor || '#000000'})` }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="relative z-10 w-full max-w-sm pointer-events-none">
                                <div
                                    className={`bg-white/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-10 border-white transition-all duration-500`}
                                    style={{
                                        borderRadius: formData.canvasConfig.rounded === 'full' ? '9999px' : formData.canvasConfig.rounded === 'xl' ? '3rem' : '1rem',
                                        opacity: formData.canvasConfig.opacity / 100,
                                        borderWidth: `${formData.canvasConfig.borderWidth}px`
                                    }}
                                >
                                    <div className="flex flex-col items-center text-center gap-6">
                                        <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center shadow-inner">
                                            <Palette className="w-12 h-12" style={{ color: formData.accent }} />
                                        </div>
                                        <div className="space-y-3 w-full">
                                            <div className="h-6 bg-gray-200/50 rounded-full w-3/4 mx-auto animate-pulse" />
                                            <div className="h-3 bg-gray-100/50 rounded-full w-1/2 mx-auto" />
                                        </div>
                                        <div className="w-full h-14 rounded-2xl mt-4" style={{ backgroundColor: formData.accent }} />
                                    </div>
                                </div>
                                <p className="text-center text-white font-black text-[10px] tracking-[0.3em] uppercase mt-10 drop-shadow-md opacity-60">EXPERIENCIA VISUAL</p>
                            </div>
                        </div>
                    </>
                )}

                {/* Builder Mode (Code) */}
                {!noCode && activeTab === 'builder' && (
                    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E]">
                        <div className="flex items-center gap-4 p-4 border-b border-gray-800">
                            <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                Modo Desarrollador Activo
                            </div>
                            <p className="text-xs text-gray-400">Tokens Disponibles: <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-400">{"{{form_login}}"}</code>, <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-400">{"{{branch_logo}}"}</code>, <code className="bg-gray-800 px-2 py-0.5 rounded text-green-400">{"{{vcard_data}}"}</code></p>
                        </div>
                        <div className="flex-1 flex w-full">
                            <div className="flex-1 flex flex-col border-r border-gray-800">
                                <div className="p-3 bg-[#252526] text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-800">HTML Template (Inyección JSX)</div>
                                <textarea
                                    value={formData.htmlTemplate}
                                    onChange={e => setFormData({ ...formData, htmlTemplate: e.target.value })}
                                    className="flex-1 w-full bg-[#1E1E1E] text-blue-300 font-mono text-sm p-6 resize-none outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="<div className='container'>&#10;  <!-- Inserta tus componentes React virtuales aquí mediante tokens -->&#10;  {{form_login}}&#10;</div>"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 bg-[#252526] text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-800">CSS Personalizado (Scoped)</div>
                                <textarea
                                    value={formData.cssCustom}
                                    onChange={e => setFormData({ ...formData, cssCustom: e.target.value })}
                                    className="flex-1 w-full bg-[#1E1E1E] text-pink-300 font-mono text-sm p-6 resize-none outline-none focus:ring-1 focus:ring-pink-500"
                                    placeholder=".container {&#10;  display: flex;&#10;  flex-direction: column;&#10;  align-items: center;&#10;}"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
