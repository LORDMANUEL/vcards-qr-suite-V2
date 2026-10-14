'use client';

import { CheckCircle2, Clock3, Globe, ShieldCheck, Wifi } from 'lucide-react';

export type PortalThemeTab = 'portal' | 'garantizado' | 'internet';

export interface PortalPageConfig {
  bgColor: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  logoUrl: string;
  bgImageUrl: string;
  bgBlur: number;
  bgOpacity: number;
  welcomeTitle: string;
  welcomeSubtitle: string;
  buttonText: string;
  buttonColor: string;
  buttonRadius: number;
  showTimer: boolean;
  timerText: string;
  cardRadius: number;
  cardMaxWidth: number;
  contentMaxWidth: number;
  logoHeight: number;
  titleSize: number;
  subtitleSize: number;
  heroAlign: 'left' | 'center' | 'right';
  bgGradient: boolean;
  gradientTo: string;
  showFieldName: boolean;
  showFieldEmail: boolean;
  showFieldPhone: boolean;
  showFieldVehicle: boolean;
  showFieldVehicleYear: boolean;
  showFieldLicensePlate: boolean;
  showFieldRtn: boolean;
  showFieldVin: boolean;
  showStatusCards: boolean;
  showSupportCard: boolean;
  supportTitle: string;
  supportText: string;
  showBanners: boolean;
  showPromotions: boolean;
  showQuickLinks: boolean;
  sectionTitleBanners: string;
  sectionTitlePromotions: string;
  sectionTitleLinks: string;
  featureChips: string[];
  sectionOrder: string[];
}

export interface PortalThemeConfig {
  portal: PortalPageConfig;
  garantizado: PortalPageConfig;
  internet: PortalPageConfig;
}

export const PORTAL_THEME_TABS: Array<{ id: PortalThemeTab; label: string }> = [
  { id: 'portal', label: 'Portal Acceso' },
  { id: 'garantizado', label: 'Acceso Garantizado' },
  { id: 'internet', label: 'Estado Internet' },
];

export function getDefaultPortalPageConfig(tab: PortalThemeTab): PortalPageConfig {
  return {
    bgColor: tab === 'internet' ? '#f3f7fb' : '#eff6ff',
    primaryColor: '#003478',
    accentColor: tab === 'portal' ? '#2563eb' : tab === 'garantizado' ? '#10b981' : '#0f766e',
    textColor: '#111827',
    logoUrl: '',
    bgImageUrl: '',
    bgBlur: 0,
    bgOpacity: 75,
    welcomeTitle:
      tab === 'portal'
        ? 'Conectate a nuestra red de invitados'
        : tab === 'garantizado'
          ? 'Acceso garantizado activo'
          : 'Estado de internet disponible',
    welcomeSubtitle:
      tab === 'portal'
        ? 'Completa tus datos para habilitar internet en este dispositivo.'
        : tab === 'garantizado'
          ? 'Tu dispositivo ya tiene acceso temporal a internet.'
          : 'Consulta el estado de la sesion y la conectividad del punto de acceso.',
    buttonText: tab === 'portal' ? 'Conectar ahora' : tab === 'garantizado' ? 'Actualizar estado' : 'Verificar conexion',
    buttonColor: tab === 'portal' ? '#2563eb' : tab === 'garantizado' ? '#10b981' : '#0f766e',
    buttonRadius: 18,
    showTimer: tab === 'garantizado',
    timerText: 'Tiempo restante',
    cardRadius: 28,
    cardMaxWidth: 420,
    contentMaxWidth: 680,
    logoHeight: 48,
    titleSize: 32,
    subtitleSize: 14,
    heroAlign: 'center',
    bgGradient: true,
    gradientTo: tab === 'garantizado' ? '#052e2b' : '#0f172a',
    showFieldName: true,
    showFieldEmail: true,
    showFieldPhone: true,
    showFieldVehicle: false,
    showFieldVehicleYear: false,
    showFieldLicensePlate: false,
    showFieldRtn: false,
    showFieldVin: false,
    showStatusCards: tab !== 'portal',
    showSupportCard: tab === 'portal',
    supportTitle: 'Soporte de conectividad',
    supportText: 'Si el acceso no se habilita en 30 segundos, consulta con el personal de la sucursal.',
    showBanners: tab !== 'garantizado',
    showPromotions: true,
    showQuickLinks: tab === 'internet',
    sectionTitleBanners: 'Banners destacados',
    sectionTitlePromotions: 'Promociones activas',
    sectionTitleLinks: 'Accesos directos',
    featureChips:
      tab === 'portal'
        ? ['WiFi invitados', 'Captura segura', 'Acceso por sucursal']
        : tab === 'garantizado'
          ? ['Sesion activa', 'Timer visible', 'Control MAC']
          : ['Diagnostico', 'Promociones', 'Links utiles'],
    sectionOrder:
      tab === 'portal'
        ? ['hero', 'support', 'banners', 'promotions', 'links']
        : tab === 'garantizado'
          ? ['hero', 'status', 'support']
          : ['hero', 'status', 'links', 'banners', 'promotions', 'support'],
  };
}

export function getDefaultPortalThemeConfig(): PortalThemeConfig {
  return {
    portal: getDefaultPortalPageConfig('portal'),
    garantizado: getDefaultPortalPageConfig('garantizado'),
    internet: getDefaultPortalPageConfig('internet'),
  };
}

export function normalizePortalThemeConfig(config: any): PortalThemeConfig {
  const defaults = getDefaultPortalThemeConfig();
  return {
    portal: { ...defaults.portal, ...(config?.portalConfig || config?.portal || {}) },
    garantizado: { ...defaults.garantizado, ...(config?.garantizadoConfig || config?.garantizado || {}) },
    internet: { ...defaults.internet, ...(config?.internetConfig || config?.internet || {}) },
  };
}

function PortalPreviewShell({ config, children }: { config: PortalPageConfig; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden p-6"
      style={{
        background: config.bgGradient ? `linear-gradient(160deg, ${config.bgColor}, ${config.gradientTo})` : config.bgColor,
      }}
    >
      {config.bgImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.bgImageUrl}
          alt="Portal theme background"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: config.bgOpacity / 100, filter: `blur(${config.bgBlur}px)` }}
        />
      ) : null}
      <div className="relative mx-auto w-full max-w-md">
        <div
          className="border border-white/60 bg-white/92 p-7 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur"
          style={{ borderRadius: config.cardRadius, maxWidth: config.cardMaxWidth, marginInline: 'auto' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function BrandHeader({ config }: { config: PortalPageConfig }) {
  const alignClass = config.heroAlign === 'left' ? 'items-start text-left' : config.heroAlign === 'right' ? 'items-end text-right' : 'items-center text-center';
  return (
    <div className={`mb-6 flex flex-col ${alignClass}`}>
      {config.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.logoUrl} alt="Logo" className="mb-4 object-contain" style={{ height: config.logoHeight }} />
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${config.primaryColor}14` }}>
          <Wifi className="h-7 w-7" style={{ color: config.primaryColor }} />
        </div>
      )}
      <h2 className="font-black leading-tight" style={{ color: config.primaryColor, fontSize: config.titleSize }}>{config.welcomeTitle}</h2>
      <p className="mt-2 font-medium" style={{ color: `${config.textColor}cc`, fontSize: config.subtitleSize }}>{config.welcomeSubtitle}</p>
    </div>
  );
}

export function PortalAccessPreview({ config, preview = false }: { config: PortalPageConfig; preview?: boolean }) {
  return (
    <PortalPreviewShell config={config}>
      <BrandHeader config={config} />
      <div className="space-y-3">
        {config.showFieldName ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Nombre completo</div> : null}
        {config.showFieldEmail ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Correo electronico</div> : null}
        {config.showFieldPhone ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Telefono / WhatsApp</div> : null}
        {config.showFieldVehicle ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Vehiculo</div> : null}
        {config.showFieldVehicleYear ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Ano del vehiculo</div> : null}
        {config.showFieldLicensePlate ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">Placa</div> : null}
        {config.showFieldRtn ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">RTN</div> : null}
        {config.showFieldVin ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">VIN</div> : null}
      </div>
      <button className="mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: config.buttonColor, borderRadius: config.buttonRadius }}>
        <Wifi className="h-4 w-4" />
        {config.buttonText}
      </button>
      {!preview ? (
        <div className="mt-5 flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Acceso seguro</span>
          <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> Captura guiada</span>
        </div>
      ) : null}
    </PortalPreviewShell>
  );
}

export function PortalGuaranteedPreview({ config, countdown = '02:45:30', mac = 'AA:BB:CC:DD:EE:FF', preview = false }: { config: PortalPageConfig; countdown?: string; mac?: string; preview?: boolean }) {
  return (
    <PortalPreviewShell config={config}>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: `${config.accentColor}18` }}>
          <CheckCircle2 className="h-9 w-9" style={{ color: config.accentColor }} />
        </div>
        <h2 className="font-black" style={{ color: config.primaryColor, fontSize: config.titleSize }}>{config.welcomeTitle}</h2>
        <p className="mt-2 font-medium" style={{ color: `${config.textColor}cc`, fontSize: config.subtitleSize }}>{config.welcomeSubtitle}</p>
      </div>
      {config.showTimer ? (
        <div className="rounded-3xl px-5 py-4 text-center" style={{ backgroundColor: `${config.accentColor}12` }}>
          <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: `${config.textColor}99` }}>{config.timerText}</p>
          <p className="mt-2 text-3xl font-black" style={{ color: config.accentColor }}>{countdown}</p>
        </div>
      ) : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Dispositivo</p>
          <p className="mt-2 text-sm font-bold text-slate-800">{mac}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</p>
          <p className="mt-2 text-sm font-bold" style={{ color: config.accentColor }}>Autorizado</p>
        </div>
      </div>
      {!preview ? (
        <button className="mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: config.buttonColor, borderRadius: config.buttonRadius }}>
          <Clock3 className="h-4 w-4" />
          {config.buttonText}
        </button>
      ) : null}
    </PortalPreviewShell>
  );
}

export function PortalInternetPreview({ config, status = 'online', latency = '24ms', preview = false }: { config: PortalPageConfig; status?: 'online' | 'offline' | 'checking'; latency?: string; preview?: boolean }) {
  const statusLabel = status === 'online' ? 'Internet disponible' : status === 'offline' ? 'Sin conexion' : 'Verificando';
  const statusColor = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : config.accentColor;

  return (
    <PortalPreviewShell config={config}>
      <div className="mb-6 flex items-center gap-4 rounded-3xl px-4 py-4" style={{ backgroundColor: `${statusColor}10` }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: statusColor }}>
          <Globe className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="font-black" style={{ color: config.primaryColor, fontSize: config.titleSize }}>{statusLabel}</p>
          <p className="font-medium" style={{ color: `${config.textColor}bb`, fontSize: config.subtitleSize }}>{config.welcomeSubtitle}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Latencia</p>
          <p className="mt-2 text-xl font-black text-slate-900">{latency}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">DNS</p>
          <p className="mt-2 text-xl font-black text-slate-900">OK</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Gateway</p>
          <p className="mt-2 text-xl font-black text-slate-900">192.168.1.1</p>
        </div>
      </div>
      {!preview ? (
        <button className="mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: config.buttonColor, borderRadius: config.buttonRadius }}>
          <Globe className="h-4 w-4" />
          {config.buttonText}
        </button>
      ) : null}
    </PortalPreviewShell>
  );
}
