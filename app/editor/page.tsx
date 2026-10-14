'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import {
  Palette,
  Save,
  Eye,
  RefreshCw,
  Layout,
  Type,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Calendar,
  Check,
  ChevronRight,
  Sparkles,
  MousePointer2
} from 'lucide-react';

type ThemeCategory = 'VCARD' | 'PORTAL';

const GOOGLE_FONTS = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Montserrat'];

export default function ThemeEditorPage() {
  const [theme, setTheme] = useState({
    name: 'Nuevo Tema Corporativo',
    category: 'VCARD' as ThemeCategory,
    colors: {
      primary: '#003478',
      secondary: '#FFFFFF',
      accent: '#10B981',
      background: '#F9FAFB',
    },
    typography: 'Inter',
    bgImageUrl: '',
    config: {
      opacity: 80,
      gradient: true,
      glassmorphism: false,
    },
    validFrom: '',
    validTo: '',
  });

  const [activeTab, setActiveTab] = useState<'design' | 'config' | 'schedule'>('design');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      if (response.ok) {
        alert('Tema "Elite" guardado exitosamente.');
      } else {
        alert('Error al guardar el tema.');
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-[#003478]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Canvas Pro: Motor de Temas" subtitle="Diseño de alta fidelidad para vCards y Portales" />

        <main className="flex-1 flex overflow-hidden">
          {/* Canvas Controls */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
            {/* Tabs Selector */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'design' ? 'text-[#003478] border-b-2 border-[#003478]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Diseño
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'config' ? 'text-[#003478] border-b-2 border-[#003478]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Canvas
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'schedule' ? 'text-[#003478] border-b-2 border-[#003478]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Programar
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {activeTab === 'design' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layout className="w-3 h-3" /> Categoría del Sistema
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTheme({ ...theme, category: 'VCARD' })}
                        className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${theme.category === 'VCARD' ? 'border-[#003478] bg-blue-50' : 'border-gray-100'}`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-[10px] font-bold">vCards</span>
                      </button>
                      <button
                        onClick={() => setTheme({ ...theme, category: 'PORTAL' })}
                        className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${theme.category === 'PORTAL' ? 'border-[#003478] bg-blue-50' : 'border-gray-100'}`}
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Portal</span>
                      </button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Paleta de Colores
                    </label>
                    <div className="space-y-3">
                      {[
                        { label: 'Color Primario', key: 'primary' },
                        { label: 'Color Fondo', key: 'background' },
                        { label: 'Color Acento', key: 'accent' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                          <input
                            type="color"
                            value={(theme.colors as any)[item.key]}
                            onChange={e => setTheme({ ...theme, colors: { ...theme.colors, [item.key]: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Type className="w-3 h-3" /> Tipografía Elite
                    </label>
                    <select
                      value={theme.typography}
                      onChange={e => setTheme({ ...theme, typography: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50 font-semibold text-sm outline-none focus:border-[#003478] transition-all"
                    >
                      {GOOGLE_FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </section>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Efectos Canvas
                    </label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span>Opacidad de Fondo</span>
                          <span>{theme.config.opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0" max="100"
                          value={theme.config.opacity}
                          onChange={e => setTheme({ ...theme, config: { ...theme.config, opacity: parseInt(e.target.value) } })}
                          className="w-full accent-[#003478]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">Gradiente Dinámico</span>
                        <input
                          type="checkbox"
                          checked={theme.config.gradient}
                          onChange={e => setTheme({ ...theme, config: { ...theme.config, gradient: e.target.checked } })}
                          className="w-5 h-5 accent-[#003478]"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Multimedia de Fondo
                    </label>
                    <input
                      type="text"
                      placeholder="URL de imagen (JPG, PNG, WEBP)"
                      value={theme.bgImageUrl}
                      onChange={e => setTheme({ ...theme, bgImageUrl: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-xs font-medium outline-none"
                    />
                  </section>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Programación Estacional
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Desde (Activación)</label>
                        <input
                          type="date"
                          value={theme.validFrom}
                          onChange={e => setTheme({ ...theme, validFrom: e.target.value })}
                          className="w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta (Caducidad)</label>
                        <input
                          type="date"
                          value={theme.validTo}
                          onChange={e => setTheme({ ...theme, validTo: e.target.value })}
                          className="w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
                      <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                        Ideal para temas automáticos de Navidad, Black Friday o Verano. El sistema activará este diseño solo entre las fechas indicadas.
                      </p>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#003478] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 text-green-400" />}
                Guardar Master Theme
              </button>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 bg-gray-100 relative p-12 overflow-auto scrollbar-hide">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
              {/* Preview Toggle */}
              <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex gap-1">
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-6 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${previewMode === 'mobile' ? 'bg-[#003478] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smartphone className="w-4 h-4" /> Móvil
                </button>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-6 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${previewMode === 'desktop' ? 'bg-[#003478] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
              </div>

              {/* THE CANVAS MOCKUP */}
              <div
                className={`relative bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] border-gray-900 overflow-hidden transition-all duration-500 ${previewMode === 'mobile' ? 'w-[320px] h-[640px] rounded-[3rem]' : 'w-full h-[500px] rounded-3xl'}`}
                style={{ fontFamily: theme.typography }}
              >
                <div className="absolute inset-0 z-0">
                  {theme.bgImageUrl ? (
                    <img
                      src={theme.bgImageUrl}
                      className="w-full h-full object-cover"
                      style={{ opacity: theme.config.opacity / 100 }}
                      alt="canvas-bg"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background: theme.config.gradient
                          ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`
                          : theme.colors.background
                      }}
                    />
                  )}
                </div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                  {theme.category === 'PORTAL' ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center">
                        <Monitor className="w-10 h-10 text-white" />
                      </div>
                      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl space-y-4">
                        <h2 className="text-xl font-black uppercase" style={{ color: theme.colors.primary }}>Portal WiFi</h2>
                        <div className="h-2 w-32 bg-gray-200 rounded-full mx-auto" />
                        <div className="space-y-2">
                          <div className="h-10 w-full bg-gray-50 border border-gray-100 rounded-xl" />
                          <button
                            className="w-full h-10 rounded-xl shadow-lg transition-transform active:scale-95"
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                      <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-xl">
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                          <MousePointer2 className="w-8 h-8" style={{ color: theme.colors.primary }} />
                        </div>
                      </div>
                      <div className="bg-white/95 rounded-[2rem] p-6 shadow-2xl space-y-3">
                        <div className="h-6 w-40 bg-gray-100 rounded-lg mx-auto" />
                        <div className="h-3 w-24 bg-gray-50 rounded-lg mx-auto" />
                        <div className="flex gap-2 justify-center pt-2">
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                          <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.colors.secondary }} />
                        </div>
                        <button
                          className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          CONTACTAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
