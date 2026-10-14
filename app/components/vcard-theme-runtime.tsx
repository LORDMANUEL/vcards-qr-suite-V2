'use client';

import { useState } from 'react';
import { Calendar, Car, Download, ExternalLink, Globe, Mail, MapPin, MessageSquare, Phone, Share2, Star } from 'lucide-react';

export interface RuntimeProfile {
  fullName: string;
  position?: string | null;
  company: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  initials: string;
  updatedLabel?: string;
  downloadCount?: number;
}

export interface RuntimeActionHandlers {
  onCall: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onDownload: () => void;
  onShare: () => void;
  onOpenUrl: (url: string) => void;
}

function normalizeAvatarSrc(src?: string | null) {
  if (!src) return '';
  const trimmed = String(src).trim();
  if (!trimmed.startsWith('data:image/')) return trimmed;
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex === -1) return trimmed;
  const header = trimmed.slice(0, commaIndex + 1);
  const payload = trimmed.slice(commaIndex + 1).replace(/\s+/g, '');
  return `${header}${payload}`;
}

function solidColor(value?: string | null) {
  if (!value) return '#003478';
  const text = String(value).trim();
  if (!text.includes('gradient')) return text;
  const match = text.match(/#(?:[0-9a-fA-F]{3}){1,2}|rgba?\([^)]*\)/);
  return match?.[0] || '#003478';
}

function ActionIcon({ type, className = 'w-5 h-5', color }: { type: string; className?: string; color?: string }) {
  const style = color ? { color } : {};
  if (type === 'tel') return <Phone className={className} style={style} />;
  if (type === 'wa') return <MessageSquare className={className} style={style} />;
  if (type === 'sms') return <Share2 className={className} style={style} />;
  if (type === 'email') return <Mail className={className} style={style} />;
  if (type === 'web' || type === 'link') return <Globe className={className} style={style} />;
  if (type === 'location') return <MapPin className={className} style={style} />;
  return <Star className={className} style={style} />;
}

function CustomOrDefaultIcon({ item, className, color }: { item: any; className: string; color?: string }) {
  if (item?.customIconUrl) {
    return <img src={item.customIconUrl} alt={item.label || 'Icon'} className={className} />;
  }
  return <ActionIcon type={item.type} className={className} color={color} />;
}

/* DualRingAvatar — dos anillos concéntricos: exterior color marca, interior blanco, centro foto o iniciales */
function DualRingAvatar({ src, alt, size, ringColor, initials }: { src: string; alt: string; size: number; ringColor: string; initials: string }) {
  const [imgError, setImgError] = useState(false);
  const color = solidColor(ringColor);
  const safeSrc = normalizeAvatarSrc(src);
  const ringOuter = 5;  // anillo de color marca
  const ringInner = 4;  // separador blanco
  const innerWrapSize = size + ringInner * 2;
  const totalSize = size + (ringOuter + ringInner) * 2;
  const inner = (!safeSrc || imgError) ? (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#ffffff',
      fontSize: Math.max(14, Math.floor(size * 0.32)),
      fontWeight: 900,
      letterSpacing: '-0.01em',
      userSelect: 'none',
    }}>
      {initials}
    </div>
  ) : (
    <img
      src={safeSrc} alt={alt}
      onError={() => setImgError(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
    />
  );
  return (
    <div style={{
      width: totalSize, height: totalSize, borderRadius: '50%',
      backgroundColor: color,
      padding: ringOuter,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
      flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: innerWrapSize, height: innerWrapSize, borderRadius: '50%',
        backgroundColor: '#ffffff',
        padding: ringInner,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {inner}
      </div>
    </div>
  );
}

/* Inyecta keyframes de animación una sola vez en el DOM */
function VCardAnimationStyles() {
  return (
    <style key="vc-anim-styles">{`
      @keyframes vcFadeIn { 0%{opacity:0} 100%{opacity:1} }
      @keyframes vcFadeInUp { 0%{opacity:0;transform:translateY(28px)} 100%{opacity:1;transform:translateY(0)} }
      @keyframes vcFadeInDown { 0%{opacity:0;transform:translateY(-28px)} 100%{opacity:1;transform:translateY(0)} }
      @keyframes vcScaleIn { 0%{opacity:0;transform:scale(0.88)} 100%{opacity:1;transform:scale(1)} }
      @keyframes vcSlideIn { 0%{opacity:0;transform:translateX(-32px)} 100%{opacity:1;transform:translateX(0)} }
      @keyframes vcBounce { 0%{opacity:0;transform:scale(0.7)} 60%{transform:scale(1.06)} 100%{opacity:1;transform:scale(1)} }
      @keyframes vcPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      @keyframes vcShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
    `}</style>
  );
}

function blockAnimStyle(p: any): React.CSSProperties {
  if (!p._animationType || p._animationType === 'none') return {};
  const nameMap: Record<string, string> = {
    fade: 'vcFadeIn', fadeInUp: 'vcFadeInUp', fadeInDown: 'vcFadeInDown',
    scaleIn: 'vcScaleIn', slide: 'vcSlideIn', bounce: 'vcBounce',
    pulse: 'vcPulse', shake: 'vcShake', wiggle: 'vcShake',
  };
  const name = nameMap[p._animationType] || 'vcFadeIn';
  return { animation: `${name} ${p._animationDuration || 600}ms ease-out ${p._animationDelay || 0}ms both` };
}

function SeasonalScene({ props }: { props: any }) {
  const primary = props.primaryColor || '#003478';
  const accent = props.accentColor || '#10b981';
  const headline = props.headline || 'Tu asesor te acompana en el camino';
  const subheadline = props.subheadline || 'Experiencia digital lista para cualquier temporada';
  const heroHeight = props.heroHeight || 180;
  const alignClass = props.contentAlign === 'left' ? 'items-start text-left' : props.contentAlign === 'right' ? 'items-end text-right' : 'items-center text-center';

  return (
    <div className="relative overflow-hidden p-6 text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, minHeight: heroHeight }}>
      {props.backgroundImageUrl ? <img src={props.backgroundImageUrl} alt="Seasonal background" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: props.backgroundPosition || 'center', opacity: 0.32 }} /> : null}
      {props.backgroundVideoUrl ? <video className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: props.backgroundPosition || 'center', opacity: 0.4 }} src={props.backgroundVideoUrl} autoPlay muted loop playsInline /> : null}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 20%), radial-gradient(circle at 80% 30%, white 0, transparent 18%)' }} />
      <div className={`relative z-10 flex h-full flex-col justify-between gap-4 ${alignClass}`}>
        <div className="max-w-xs">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Tema estacional</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">{headline}</h2>
          <p className="mt-2 text-sm text-white/80">{subheadline}</p>
        </div>
        <div className="h-24 w-36 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm" />
      </div>
    </div>
  );
}

export function renderVCardLayout({ layout, profile, handlers }: { layout: any[]; profile: RuntimeProfile; handlers: RuntimeActionHandlers }) {
  const actionMap: Record<string, () => void> = {
    tel: handlers.onCall,
    email: handlers.onEmail,
    wa: handlers.onWhatsApp,
    download: handlers.onDownload,
    share: handlers.onShare,
  };

  const blocks = layout.map((block: any) => {
    const p = block.props || {};
    const anim = blockAnimStyle(p);

    if (block.type === 'SeasonalHero') {
      return <div key={block.id} style={anim}><SeasonalScene props={p} /></div>;
    }

    if (block.type === 'Header') {
      return (
        <div key={block.id} style={{ backgroundColor: p.bgColor, color: p.textColor, backgroundImage: p.backgroundImageUrl ? `url(${p.backgroundImageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: p.backgroundPosition || 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: p._height || undefined, boxSizing: 'border-box', ...anim }} className="p-8 pb-10 text-center relative overflow-hidden">
          {p.backgroundVideoUrl ? <video className="absolute inset-0 h-full w-full object-cover" src={p.backgroundVideoUrl} autoPlay muted loop playsInline /> : null}
          <div className="relative z-10">
          {p.logoUrl || profile.logoUrl ? <img src={p.logoUrl || profile.logoUrl || ''} alt="Logo" className={`mb-3 rounded-2xl bg-white/10 p-2 object-contain ${p.logoAlign === 'left' ? 'mr-auto' : p.logoAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} style={{ height: `${p.logoHeight || 90}px`, width: p.logoWidth ? `${p.logoWidth}px` : 'auto' }} /> : null}
          <h2 className="text-xl font-black leading-tight">{p.title || profile.company}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{p.subtitle || 'Contacto digital'}</p>
          </div>
        </div>
      );
    }

    if (block.type === 'Profile') {
      const maxAvatarSize = p._height ? Math.max(48, Math.min(72, Math.round(p._height * 0.45))) : 72;
      const avatarSize = Math.max(48, Math.min(p.avatarSize || maxAvatarSize, maxAvatarSize));
      const avatarSrc = p.avatarUrl || (p._height ? (profile.avatarUrl || '') : '');
      const cardBg = p.cardBgColor || undefined;
      const cardRadius = p.cardRadius || 20;
      const alignClass = p.align === 'left' ? 'items-start text-left' : p.align === 'right' ? 'items-end text-right' : 'items-center text-center';
      const textAlign = p.align === 'left' ? 'left' : p.align === 'right' ? 'right' : 'center';
      const avatarWrapJustify = p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center';
      return (
        <div key={block.id} className={`px-6 py-4 ${alignClass}`}>
          {cardBg ? (
            <div style={{ background: cardBg, borderRadius: cardRadius, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '16px 20px 12px', width: '100%', minHeight: p._height || undefined, boxSizing: 'border-box', textAlign }}>
              <div style={{ display: 'flex', justifyContent: avatarWrapJustify, marginBottom: 14 }}>
                <DualRingAvatar
                  src={avatarSrc}
                  alt={profile.fullName}
                  size={avatarSize}
                  ringColor={p.avatarBg || '#003478'}
                  initials={p.avatarText || profile.initials}
                />
              </div>
              <h1 style={{ color: p.nameColor, fontSize: p.nameSize || 24 }} className="font-black">{profile.fullName}</h1>
              {profile.position ? <p className="mt-1 text-sm font-semibold text-gray-500">{profile.position}</p> : null}
              {p.showCompany !== false ? <p className="mt-1 text-xs font-bold uppercase" style={{ color: p.nameColor || '#003478' }}>{profile.company}</p> : null}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: avatarWrapJustify, marginBottom: 14 }}>
                <DualRingAvatar
                  src={avatarSrc}
                  alt={profile.fullName}
                  size={avatarSize}
                  ringColor={p.avatarBg || '#003478'}
                  initials={p.avatarText || profile.initials}
                />
              </div>
              <h1 style={{ color: p.nameColor, fontSize: p.nameSize || 24 }} className="font-black">{profile.fullName}</h1>
              {profile.position ? <p className="mt-1 text-sm font-semibold text-gray-500">{profile.position}</p> : null}
              {p.showCompany !== false ? <p className="mt-1 text-xs font-bold uppercase" style={{ color: p.nameColor || '#003478' }}>{profile.company}</p> : null}
            </>
          )}
        </div>
      );
    }

    if (block.type === 'ContactActions') {
      const items = Array.isArray(p.items) ? p.items : [];
      const iconSize = p.iconSize || 20;
      const buttonRadius = p.buttonRadius || 16;
      const showBorder = p.showBorder === true;
      const itemBorderColor = p.itemBorderColor || '#e5e7eb';
      return (
        <div key={block.id} className="grid gap-2 px-5 py-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(items.length || 1, 4))}, 1fr)`, background: p.sectionBgColor || 'transparent' }}>
          {items.map((item: any) => {
            const clickHandler = item.href ? () => handlers.onOpenUrl(item.href) : actionMap[item.type];
            return (
              <button key={item.id} onClick={clickHandler} style={{ backgroundColor: item.bgColor, borderRadius: `${buttonRadius}px`, padding: p.buttonPadding || 12, border: showBorder ? `1px solid ${item.borderColor || itemBorderColor}` : 'none' }} className="flex flex-col items-center justify-center gap-2 shadow-sm transition hover:opacity-90">
                <div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
                  <CustomOrDefaultIcon item={item} className="w-full h-full object-contain" color={item.textColor} />
                </div>
                <span style={{ color: item.textColor }} className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (block.type === 'PromoStrip') {
      const promos = Array.isArray(p.items) ? p.items : [];
      return (
        <div key={block.id} className="space-y-3 px-5 py-4" style={{ backgroundColor: p.bgColor || 'transparent' }}>
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 ${p.titleAlign === 'left' ? 'text-left' : p.titleAlign === 'right' ? 'text-right' : 'text-center'}`}>{p.title || 'Promociones'}</p>
          {promos.map((promo: any) => (
            <div key={promo.id} className="border border-gray-100 bg-white p-4 shadow-sm" style={{ borderRadius: p.cardRadius || 16 }}>
              <p className="text-sm font-black text-gray-900">{promo.title}</p>
              <p className="mt-1 text-xs text-gray-500">{promo.description}</p>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'StatsBar') {
      const stats = Array.isArray(p.items) ? p.items : [];
      return (
        <div key={block.id} className="grid gap-3 px-5 py-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(p.columns || 3, 4))}, minmax(0, 1fr))`, backgroundColor: p.bgColor || 'transparent' }}>
          {stats.map((item: any) => (
            <div key={item.id} className="bg-gray-50 p-4 text-center" style={{ borderRadius: p.cardRadius || 16, backgroundColor: p.cardBgColor || '#f9fafb' }}>
              <p className="text-lg font-black" style={{ color: p.highlightColor || '#003478' }}>{item.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'ContactInfo') {
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        <div key={block.id} style={{ backgroundColor: p.bgColor }} className="space-y-2.5 px-5 py-4">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3.5 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div style={{ backgroundColor: p.iconBg }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <ActionIcon type={item.icon} className="w-3.5 h-3.5" color={p.iconColor || '#fff'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className="truncate text-[13px] font-bold text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === 'ActionButton' || block.type === 'CTAButton') {
      return (
        <div key={block.id} className="px-5 py-4">
          <button onClick={handlers.onDownload} style={{ backgroundColor: p.bgColor, color: p.textColor, borderRadius: `${p.borderRadius || 12}px` }} className="flex w-full items-center justify-center gap-2 py-4 text-sm font-bold shadow-lg transition hover:brightness-110">
            <Download className="h-4 w-4" /> {p.label || p.text || 'Guardar en Contactos (vCard)'}
          </button>
        </div>
      );
    }

    if (block.type === 'Footer') {
      return (
        <div key={block.id} className={`relative overflow-hidden px-5 text-center ${p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center'}`} style={{ backgroundColor: p.bgColor || '#0f172a', color: p.textColor || '#ffffff', paddingTop: p.paddingY || 24, paddingBottom: p.paddingY || 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          {p.backgroundImageUrl ? <img src={p.backgroundImageUrl} alt="Footer background" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.backgroundPosition || 'center', opacity: 0.22 }} /> : null}
          {p.backgroundVideoUrl ? <video className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.backgroundPosition || 'center', opacity: 0.25 }} src={p.backgroundVideoUrl} autoPlay muted loop playsInline /> : null}
          <div className="relative z-10">
          <p className="text-sm font-black">{p.title || p.text || profile.company}</p>
          <p className="mt-1 text-xs font-medium opacity-80">{p.subtitle || p.subtext || `Actualizado ${profile.updatedLabel || 'recientemente'}`}</p>
          {p.showLegal === true ? <p className="mt-3 text-[11px] opacity-70">{p.legalText || `© ${new Date().getFullYear()} ${profile.company}`}</p> : null}
          </div>
        </div>
      );
    }

    if (block.type === 'Divider') {
      return <div key={block.id} className="px-5 py-3"><hr style={{ borderColor: p.color }} /></div>;
    }

    if (block.type === 'Spacer') {
      return <div key={block.id} style={{ height: `${p.height || 24}px` }} />;
    }

    if (block.type === 'AnimationWidget') {
      return (
        <div key={block.id} className={`relative px-5 py-4 ${p.align === 'center' ? 'text-center' : p.align === 'right' ? 'text-right' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${p.animationClass || 'animate-pulse'}`} style={{ backgroundColor: p.bgColor || '#111827', color: p.textColor || '#ffffff', transform: `translate(${p.offsetX || 0}px, ${p.offsetY || 0}px) scale(${p.scale || 1})` }}>
            <span className="text-xl">{p.emoji || '✨'}</span>
            <span className="text-sm font-black">{p.label || 'Animacion'}</span>
          </div>
        </div>
      );
    }

    if (block.type === 'AnimationOverlay') {
      return (
        <div key={block.id} className="relative h-0 overflow-visible pointer-events-none">
          <div className={`${p.animationClass || 'animate-bounce'} absolute`} style={{ top: p.top || 0, left: p.left || 0, zIndex: p.zIndex || 20, opacity: p.opacity ?? 1, transform: `scale(${p.scale || 1})` }}>
            {p.customImageUrl ? <img src={p.customImageUrl} alt={p.label || 'overlay'} style={{ width: p.size || 48, height: p.size || 48 }} className="object-contain" /> : <span style={{ fontSize: p.size || 42 }}>{p.emoji || '🕷️'}</span>}
          </div>
        </div>
      );
    }

    if (block.type === 'EmbedWidget' || block.type === 'EmbedBlock') {
      return (
        <div key={block.id} className="px-5 py-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5" style={{ height: p.height || 220 }}>
            {p.embedType === 'iframe' ? (
              <iframe src={p.embedUrl} title={p.title || 'Embed widget'} className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : p.embedType === 'video' ? (
              <video src={p.embedUrl} className="h-full w-full object-cover" autoPlay={p.autoplay !== false} muted={p.muted !== false} loop={p.loop !== false} controls={p.controls === true} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-gray-500">Define un embed URL valido</div>
            )}
          </div>
        </div>
      );
    }

    if (block.type === 'HTMLBlock') {
      return (
        <div key={block.id} className="px-5 py-4">
          <div className="overflow-auto rounded-2xl border border-gray-200 bg-white p-3" dangerouslySetInnerHTML={{ __html: p.htmlContent || '<div class="text-sm text-gray-500">HTML sin contenido</div>' }} />
        </div>
      );
    }

    if (block.type === 'ProgrammableButton') {
      const handleProgrammableAction = () => {
        if (p.actionType === 'url') {
          window.open(p.actionUrl, p.openInNewTab !== false ? '_blank' : '_self', 'noopener,noreferrer');
        } else if (p.actionType === 'tel' && p.phoneNumber) {
          window.location.href = `tel:${p.phoneNumber}`;
        } else if (p.actionType === 'email' && p.emailAddress) {
          window.location.href = `mailto:${p.emailAddress}`;
        } else if (p.actionType === 'whatsapp' && p.whatsappNumber) {
          const message = encodeURIComponent(p.whatsappMessage || 'Hola, estoy interesado en sus servicios');
          window.open(`https://wa.me/${p.whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
        } else if (p.actionType === 'share') {
          if (navigator.share) {
            navigator.share({ title: p.shareTitle || profile.fullName, url: window.location.href }).catch(() => {});
          } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado al portapapeles');
          }
        } else if (p.actionType === 'download') {
          handlers.onDownload();
        } else if (p.actionType === 'call') {
          handlers.onCall();
        }
      };
      
      const buttonStyle = p.animationStyle === 'pulse' ? 'animate-pulse' : 
                         p.animationStyle === 'bounce' ? 'animate-bounce' : 
                         p.animationStyle === 'wiggle' ? 'animate-ping' : '';
      
      return (
        <div key={block.id} className="px-5 py-4">
          <button 
            onClick={handleProgrammableAction}
            style={{ 
              backgroundColor: p.bgColor, 
              color: p.textColor, 
              borderRadius: `${p.borderRadius || 12}px`,
              border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor || 'transparent'}` : 'none',
              boxShadow: p.shadowEnabled !== false ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
            }}
            className={`flex w-full items-center justify-center gap-2 py-4 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] ${buttonStyle}`}
          >
            {p.iconType === 'whatsapp' && <span>💬</span>}
            {p.iconType === 'phone' && <span>📞</span>}
            {p.iconType === 'email' && <span>✉️</span>}
            {p.iconType === 'share' && <span>📤</span>}
            {p.iconType === 'download' && <span>📥</span>}
            {p.iconType === 'link' && <span>🔗</span>}
            {p.iconType === 'location' && <span>📍</span>}
            {p.label || 'Boton'}
          </button>
        </div>
      );
    }

    if (block.type === 'AnimatedCard') {
      return (
        <div key={block.id} className="px-5 py-4">
          <div 
            className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
            style={{ 
              borderRadius: p.cardRadius || 16,
              border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor || '#e5e7eb'}` : 'none'
            }}
          >
            {p.imageUrl && (
              <div className="relative overflow-hidden" style={{ height: p.imageHeight || 160 }}>
                <img 
                  src={p.imageUrl} 
                  alt={p.title || 'Card image'} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
                />
                {p.imageOverlay && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </div>
            )}
            <div className="p-4">
              {p.title && (
                <h3 className="text-lg font-bold" style={{ color: p.titleColor || '#1f2937' }}>{p.title}</h3>
              )}
              {p.description && (
                <p className="mt-2 text-sm" style={{ color: p.descriptionColor || '#6b7280' }}>{p.description}</p>
              )}
              {p.ctaLabel && (
                <button 
                  onClick={() => p.ctaUrl && window.open(p.ctaUrl, '_blank')}
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-bold transition-colors"
                  style={{ backgroundColor: p.ctaBgColor || '#003478', color: p.ctaTextColor || '#ffffff' }}
                >
                  {p.ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'Gallery') {
      const images = Array.isArray(p.images) ? p.images : [];
      const columns = p.columns || 2;
      return (
        <div key={block.id} className="px-5 py-4">
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {images.map((img: any, idx: number) => (
              <div 
                key={idx}
                className="relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105"
                style={{ aspectRatio: p.aspectRatio || '1/1' }}
              >
                <img 
                  src={img.src} 
                  alt={img.alt || `Gallery image ${idx + 1}`} 
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (block.type === 'ButtonRow') {
      const buttons = Array.isArray(p.buttons) ? p.buttons : [];
      return (
        <div key={block.id} className="px-5" style={{ paddingTop: p.paddingY || 4, paddingBottom: p.paddingY || 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, buttons.length)}, 1fr)`, gap: p.gap || 12 }}>
            {buttons.map((btn: any) => {
              const handleBtnClick = () => {
                if (btn.actionType === 'url' && btn.actionUrl) {
                  window.open(btn.actionUrl, '_blank', 'noopener,noreferrer');
                } else if (btn.actionType === 'tel' && btn.phoneNumber) {
                  window.location.href = `tel:${btn.phoneNumber}`;
                } else if (btn.actionType === 'whatsapp' && btn.whatsappNumber) {
                  const msg = encodeURIComponent(btn.whatsappMessage || '');
                  window.open(`https://wa.me/${btn.whatsappNumber.replace(/\D/g, '')}?text=${msg}`, '_blank', 'noopener,noreferrer');
                } else if (btn.actionType === 'download') {
                  handlers.onDownload();
                } else if (btn.actionType === 'call') {
                  handlers.onCall();
                }
              };
              const BtnIcon = btn.iconType === 'calendar' ? Calendar : btn.iconType === 'car' ? Car : null;
              return (
                <button
                  key={btn.id}
                  onClick={handleBtnClick}
                  style={{
                    backgroundColor: btn.bgColor || '#003478',
                    color: btn.textColor || '#ffffff',
                    borderRadius: `${btn.borderRadius || 12}px`,
                    border: btn.borderWidth ? `${btn.borderWidth}px solid ${btn.borderColor || '#e5e7eb'}` : 'none',
                    minHeight: 68,
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 px-3 py-3.5 text-xs font-bold shadow-sm transition hover:brightness-110 active:scale-95"
                >
                  {btn.iconEmoji && !BtnIcon ? <span className="text-xl leading-none">{btn.iconEmoji}</span> : null}
                  {BtnIcon ? <BtnIcon className="h-5 w-5" /> : null}
                  <span className="text-center leading-tight">{btn.label || 'Botón'}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (block.type === 'MapBlock') {
      return (
        <div key={block.id} className="px-5 py-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {p.mapEmbedUrl ? (
              <div style={{ height: p.mapHeight || 180 }} className="overflow-hidden">
                <iframe
                  src={p.mapEmbedUrl}
                  title={p.title || 'Ubicación'}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <div>
                  <p className="font-black text-gray-800">{p.title || 'Nuestra Ubicación'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.subtitle || 'Contacto digital corporativo'}</p>
                </div>
              </div>
              {p.mapsUrl ? (
                <button
                  onClick={() => window.open(p.mapsUrl, '_blank', 'noopener,noreferrer')}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  {p.buttonLabel || 'Ver en Google Maps'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return null;
  });

  return [<VCardAnimationStyles key="__vc_anim__" />, ...blocks];
}
