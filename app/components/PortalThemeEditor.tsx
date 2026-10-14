'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Image as ImageIcon, Monitor, Palette, Save, Smartphone, Tablet, Type } from 'lucide-react';
import {
  PORTAL_THEME_TABS,
  PortalAccessPreview,
  PortalGuaranteedPreview,
  PortalInternetPreview,
  PortalPageConfig,
  PortalThemeTab,
  getDefaultPortalThemeConfig,
  normalizePortalThemeConfig,
} from './portal-theme-kit';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero principal',
  status: 'Tarjetas de estado',
  support: 'Tarjeta soporte',
  banners: 'Banners',
  promotions: 'Promociones',
  links: 'Links rapidos',
};

interface PortalThemeEditorProps {
  mode: 'create' | 'edit';
  themeId?: string;
  initialData?: any;
}

export function PortalThemeEditor({ mode, themeId, initialData }: PortalThemeEditorProps) {
  const router = useRouter();
  const initialConfig = useMemo(() => normalizePortalThemeConfig(initialData?.config), [initialData?.config]);
  const [activeTab, setActiveTab] = useState<PortalThemeTab>('portal');
  const [saving, setSaving] = useState(false);
  const [themeName, setThemeName] = useState(initialData?.name || 'Nuevo Tema Portal');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [configs, setConfigs] = useState(initialConfig || getDefaultPortalThemeConfig());
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const currentConfig = configs[activeTab];

  const updateCurrentConfig = (patch: Partial<PortalPageConfig>) => {
    setConfigs((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...patch } }));
  };

  const updateFeatureChip = (index: number, value: string) => {
    const next = [...currentConfig.featureChips];
    next[index] = value;
    updateCurrentConfig({ featureChips: next });
  };

  const addFeatureChip = () => {
    updateCurrentConfig({ featureChips: [...currentConfig.featureChips, 'Nuevo widget'] });
  };

  const removeFeatureChip = (index: number) => {
    updateCurrentConfig({ featureChips: currentConfig.featureChips.filter((_, currentIndex) => currentIndex !== index) });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...currentConfig.sectionOrder];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    updateCurrentConfig({ sectionOrder: next });
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      const payload = {
        name: themeName,
        category: 'PORTAL',
        type: initialData?.type || 'CORPORATE',
        typography: initialData?.typography || 'Inter',
        colors: JSON.stringify({
          primary: configs.portal.primaryColor,
          secondary: configs.portal.bgColor,
          accent: configs.portal.accentColor,
        }),
        bgImageUrl: configs.portal.bgImageUrl || null,
        isActive,
        htmlTemplate: null,
        cssCustom: null,
        config: {
          portalConfig: configs.portal,
          garantizadoConfig: configs.garantizado,
          internetConfig: configs.internet,
        },
      };

      const res = await fetch(mode === 'edit' ? `/api/themes/${themeId}` : '/api/themes', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar el tema');
      }

      router.push('/temas-portal');
    } catch (error) {
      console.error(error);
      alert('Error al guardar el tema portal.');
    } finally {
      setSaving(false);
    }
  };

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (nextValue: string) => void }) => (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded-xl border border-gray-200" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (nextValue: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#003478]' : 'bg-gray-300'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f5f7fb]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/temas-portal')} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input value={themeName} onChange={(e) => setThemeName(e.target.value)} className="bg-transparent text-lg font-bold text-gray-900 outline-none" />
              <p className="text-xs font-medium text-gray-400">Editor visual de Portal Cautivo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive((prev) => !prev)} className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {isActive ? 'Activo' : 'Borrador'}
            </button>
            <button onClick={saveTheme} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#003478] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#002557] disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar tema'}
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex gap-2">
            {PORTAL_THEME_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition ${activeTab === tab.id ? 'border-[#003478] text-[#003478]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[410px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-6">
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Palette className="h-3.5 w-3.5" /> Colores</h3>
                <ColorField label="Color principal" value={currentConfig.primaryColor} onChange={(value) => updateCurrentConfig({ primaryColor: value })} />
                <ColorField label="Color acento" value={currentConfig.accentColor} onChange={(value) => updateCurrentConfig({ accentColor: value, buttonColor: value })} />
                <ColorField label="Color fondo" value={currentConfig.bgColor} onChange={(value) => updateCurrentConfig({ bgColor: value })} />
                <ColorField label="Color texto" value={currentConfig.textColor} onChange={(value) => updateCurrentConfig({ textColor: value })} />
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><ImageIcon className="h-3.5 w-3.5" /> Branding y fondo</h3>
                <input type="text" value={currentConfig.logoUrl} onChange={(e) => updateCurrentConfig({ logoUrl: e.target.value })} placeholder="URL logo" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <input type="text" value={currentConfig.bgImageUrl} onChange={(e) => updateCurrentConfig({ bgImageUrl: e.target.value })} placeholder="URL imagen de fondo" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <Toggle label="Usar degradado" checked={currentConfig.bgGradient} onChange={(value) => updateCurrentConfig({ bgGradient: value })} />
                {currentConfig.bgGradient ? <ColorField label="Color final degradado" value={currentConfig.gradientTo} onChange={(value) => updateCurrentConfig({ gradientTo: value })} /> : null}
                <label className="block text-xs font-bold text-gray-500">Blur: {currentConfig.bgBlur}px</label>
                <input type="range" min={0} max={24} value={currentConfig.bgBlur} onChange={(e) => updateCurrentConfig({ bgBlur: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Opacidad fondo: {currentConfig.bgOpacity}%</label>
                <input type="range" min={10} max={100} value={currentConfig.bgOpacity} onChange={(e) => updateCurrentConfig({ bgOpacity: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Radio tarjeta: {currentConfig.cardRadius}px</label>
                <input type="range" min={12} max={40} value={currentConfig.cardRadius} onChange={(e) => updateCurrentConfig({ cardRadius: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Ancho maximo tarjeta: {currentConfig.cardMaxWidth}px</label>
                <input type="range" min={320} max={560} value={currentConfig.cardMaxWidth} onChange={(e) => updateCurrentConfig({ cardMaxWidth: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Ancho maximo contenido: {currentConfig.contentMaxWidth}px</label>
                <input type="range" min={420} max={860} value={currentConfig.contentMaxWidth} onChange={(e) => updateCurrentConfig({ contentMaxWidth: Number(e.target.value) })} className="w-full accent-[#003478]" />
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Type className="h-3.5 w-3.5" /> Mensajes</h3>
                <input type="text" value={currentConfig.welcomeTitle} onChange={(e) => updateCurrentConfig({ welcomeTitle: e.target.value })} placeholder="Titulo" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <textarea value={currentConfig.welcomeSubtitle} onChange={(e) => updateCurrentConfig({ welcomeSubtitle: e.target.value })} placeholder="Subtitulo" rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <input type="text" value={currentConfig.buttonText} onChange={(e) => updateCurrentConfig({ buttonText: e.target.value })} placeholder="Texto boton" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Radio boton: {currentConfig.buttonRadius}px</label>
                <input type="range" min={8} max={30} value={currentConfig.buttonRadius} onChange={(e) => updateCurrentConfig({ buttonRadius: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Tamano logo: {currentConfig.logoHeight}px</label>
                <input type="range" min={24} max={90} value={currentConfig.logoHeight} onChange={(e) => updateCurrentConfig({ logoHeight: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Tamano titulo: {currentConfig.titleSize}px</label>
                <input type="range" min={22} max={48} value={currentConfig.titleSize} onChange={(e) => updateCurrentConfig({ titleSize: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <label className="block text-xs font-bold text-gray-500">Tamano subtitulo: {currentConfig.subtitleSize}px</label>
                <input type="range" min={11} max={20} value={currentConfig.subtitleSize} onChange={(e) => updateCurrentConfig({ subtitleSize: Number(e.target.value) })} className="w-full accent-[#003478]" />
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Alineacion hero</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((align) => (
                      <button key={align} type="button" onClick={() => updateCurrentConfig({ heroAlign: align as any })} className={`rounded-xl py-2 text-[10px] font-black uppercase tracking-widest ${currentConfig.heroAlign === align ? 'bg-[#003478] text-white' : 'border border-gray-200 bg-gray-50 text-gray-500'}`}>{align}</button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Widgets y secciones</h3>
                <Toggle label="Mostrar tarjeta de soporte" checked={currentConfig.showSupportCard} onChange={(value) => updateCurrentConfig({ showSupportCard: value })} />
                <Toggle label="Mostrar banners" checked={currentConfig.showBanners} onChange={(value) => updateCurrentConfig({ showBanners: value })} />
                <Toggle label="Mostrar promociones" checked={currentConfig.showPromotions} onChange={(value) => updateCurrentConfig({ showPromotions: value })} />
                <Toggle label="Mostrar links rapidos" checked={currentConfig.showQuickLinks} onChange={(value) => updateCurrentConfig({ showQuickLinks: value })} />
                <Toggle label="Mostrar tarjetas de estado" checked={currentConfig.showStatusCards} onChange={(value) => updateCurrentConfig({ showStatusCards: value })} />
                <input type="text" value={currentConfig.supportTitle} onChange={(e) => updateCurrentConfig({ supportTitle: e.target.value })} placeholder="Titulo soporte" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <textarea value={currentConfig.supportText} onChange={(e) => updateCurrentConfig({ supportText: e.target.value })} placeholder="Texto soporte" rows={3} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <input type="text" value={currentConfig.sectionTitleBanners} onChange={(e) => updateCurrentConfig({ sectionTitleBanners: e.target.value })} placeholder="Titulo banners" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <input type="text" value={currentConfig.sectionTitlePromotions} onChange={(e) => updateCurrentConfig({ sectionTitlePromotions: e.target.value })} placeholder="Titulo promociones" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                <input type="text" value={currentConfig.sectionTitleLinks} onChange={(e) => updateCurrentConfig({ sectionTitleLinks: e.target.value })} placeholder="Titulo links" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Widgets rapidos</h3>
                  <button type="button" onClick={addFeatureChip} className="rounded-xl bg-[#003478] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">Agregar</button>
                </div>
                {currentConfig.featureChips.map((chip, index) => (
                  <div key={`${activeTab}-chip-${index}`} className="flex items-center gap-2">
                    <input value={chip} onChange={(e) => updateFeatureChip(index, e.target.value)} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" />
                    <button type="button" onClick={() => removeFeatureChip(index)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-500">Quitar</button>
                  </div>
                ))}
              </section>

              <section className="space-y-3 border-t border-gray-100 pt-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Orden de secciones</h3>
                {currentConfig.sectionOrder.map((sectionId, index) => (
                  <div key={`${activeTab}-section-${sectionId}`} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">{SECTION_LABELS[sectionId] || sectionId}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveSection(index, -1)} className="rounded-xl border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">Subir</button>
                      <button type="button" onClick={() => moveSection(index, 1)} className="rounded-xl border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">Bajar</button>
                    </div>
                  </div>
                ))}
              </section>

              {activeTab === 'portal' ? (
                <section className="space-y-3 border-t border-gray-100 pt-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Campos visibles</h3>
                  <Toggle label="Nombre" checked={currentConfig.showFieldName} onChange={(value) => updateCurrentConfig({ showFieldName: value })} />
                  <Toggle label="Email" checked={currentConfig.showFieldEmail} onChange={(value) => updateCurrentConfig({ showFieldEmail: value })} />
                  <Toggle label="Telefono" checked={currentConfig.showFieldPhone} onChange={(value) => updateCurrentConfig({ showFieldPhone: value })} />
                  <Toggle label="Vehiculo" checked={currentConfig.showFieldVehicle} onChange={(value) => updateCurrentConfig({ showFieldVehicle: value })} />
                  <Toggle label="Ano vehiculo" checked={currentConfig.showFieldVehicleYear} onChange={(value) => updateCurrentConfig({ showFieldVehicleYear: value })} />
                  <Toggle label="Placa" checked={currentConfig.showFieldLicensePlate} onChange={(value) => updateCurrentConfig({ showFieldLicensePlate: value })} />
                  <Toggle label="RTN" checked={currentConfig.showFieldRtn} onChange={(value) => updateCurrentConfig({ showFieldRtn: value })} />
                  <Toggle label="VIN" checked={currentConfig.showFieldVin} onChange={(value) => updateCurrentConfig({ showFieldVin: value })} />
                </section>
              ) : null}

              {activeTab === 'garantizado' ? (
                <section className="space-y-3 border-t border-gray-100 pt-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timer</h3>
                  <Toggle label="Mostrar timer" checked={currentConfig.showTimer} onChange={(value) => updateCurrentConfig({ showTimer: value })} />
                  {currentConfig.showTimer ? <input type="text" value={currentConfig.timerText} onChange={(e) => updateCurrentConfig({ timerText: e.target.value })} placeholder="Etiqueta timer" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003478]" /> : null}
                </section>
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto bg-[#eef2f6] p-8">
            <div className="w-full max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500">
                  <Eye className="h-3.5 w-3.5 text-[#003478]" /> Preview en vivo
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1">
                  {[
                    { id: 'mobile', icon: Smartphone, label: 'Movil' },
                    { id: 'tablet', icon: Tablet, label: 'Tablet' },
                    { id: 'desktop', icon: Monitor, label: 'Desktop' },
                  ].map((mode) => (
                    <button key={mode.id} type="button" onClick={() => setPreviewMode(mode.id as any)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest ${previewMode === mode.id ? 'bg-[#003478] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                      <mode.icon className="h-3.5 w-3.5" /> {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mx-auto transition-all" style={{ width: previewMode === 'mobile' ? 420 : previewMode === 'tablet' ? 720 : 1040, maxWidth: '100%' }}>
                {activeTab === 'portal' ? <PortalAccessPreview config={configs.portal} /> : null}
                {activeTab === 'garantizado' ? <PortalGuaranteedPreview config={configs.garantizado} /> : null}
                {activeTab === 'internet' ? <PortalInternetPreview config={configs.internet} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
