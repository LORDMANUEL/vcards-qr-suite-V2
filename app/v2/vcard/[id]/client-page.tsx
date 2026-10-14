'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Phone, Mail, MapPin, Globe, Download, Share2 } from 'lucide-react';
import { renderVCardLayout } from '../../../components/vcard-theme-runtime';
import { AutomotiveBrandHero } from '../../../components/automotive-brand-hero';
import { buildMailto, getPositionGroup, isSafePublicUrl } from '@/lib/vcard-profile';

interface VCardTheme {
  id?: string;
  name?: string;
  colors?: string | null;
  config?: unknown;
  bgImageUrl?: string | null;
  isActive?: boolean;
  validFrom?: string | Date | null;
  validTo?: string | Date | null;
}

interface BranchCompany {
  defaultVcardTheme?: VCardTheme | null;
  seasonalVcardTheme?: VCardTheme | null;
}

interface VCardBranch {
  id?: string;
  companyName?: string | null;
  name: string;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  company?: BranchCompany | null;
  theme?: VCardTheme | null;
  vcardTheme?: VCardTheme | null;
  seasonalVcardTheme?: VCardTheme | null;
  vcardPositionThemeRules?: Array<{
    positionGroup: string;
    isEnabled: boolean;
    theme?: VCardTheme | null;
  }>;
}

interface VCardData {
  vcard: {
    id: string;
    user: {
      name: string;
      position?: string | null;
      email: string;
      phone?: string | null;
      photoUrl?: string | null;
      website?: string | null;
    };
    branch?: VCardBranch | null;
    downloadCount: number;
    updatedAt: string;
  };
  activeGlobalTheme?: VCardTheme | null;
}

export default function ClientVCardPage({ initialData, vCardId, disableTracking = false }: { initialData?: VCardData | null; vCardId: string; disableTracking?: boolean }) {
  const [vcard, setVcard] = useState<VCardData['vcard'] | null>(initialData?.vcard || null);
  const [activeGlobalTheme, setActiveGlobalTheme] = useState<VCardTheme | null>(initialData?.activeGlobalTheme || null);
  const [loadingData, setLoadingData] = useState(!initialData?.vcard);

  const recordScan = async (databaseVCardId: string) => {
    const query = new URLSearchParams(window.location.search);
    const scanMethod = query.has('sig') ? 'QR' : 'DIRECT';
    try {
      await fetch('/api/vcards/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcardId: databaseVCardId, scanMethod }),
      });
    } catch (error) {
      console.error('Error recording scan:', error);
    }
  };

  useEffect(() => {
    // Fallback: if SSR data is missing, load directly from API on client.
    if (!initialData?.vcard && vCardId) {
      (async () => {
        try {
          const response = await fetch(`/api/vcard/${vCardId}`, { cache: 'no-store' });
          if (!response.ok) {
            setLoadingData(false);
            return;
          }
          const payload = await response.json();
          setVcard(payload?.vcard || null);
          setActiveGlobalTheme(payload?.activeGlobalTheme || null);
        } catch (error) {
          console.error('Error loading vCard on client fallback:', error);
        } finally {
          setLoadingData(false);
        }
      })();
    }

  }, [vCardId, initialData?.vcard]);

  useEffect(() => {
    if (!disableTracking && vcard?.id) void recordScan(vcard.id);
  }, [disableTracking, vcard?.id]);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  const handleDownloadVCard = async () => {
    try {
      const response = await fetch(`/api/vcard/${vCardId}/download`);
      if (!response?.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window?.URL?.createObjectURL(blob);
      const a = document?.createElement('a');
      if (a) {
        a.href = url;
        a.download = `${vcard?.user?.name?.replace(/\s+/g, '-')}.vcf`;
        document?.body?.appendChild(a);
        a.click();
        document?.body?.removeChild(a);
        window?.URL?.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading vCard:', err);
      alert('Error al descargar el contacto');
    }
  };

  const handleShare = async () => {
    const url = window?.location?.href ?? '';
    const text = `Contacto de ${vcard?.user?.name ?? ''} - ${vcard?.branch?.name ?? 'Ford Yude Canahuati'}`;

    if (navigator?.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator?.clipboard?.writeText(url);
        alert('Link copiado al portapapeles');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const trackClick = (actionType: string) => {
    if (disableTracking || !vcard?.id) return;
    fetch('/api/vcards/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vcardId: vcard.id, actionType }),
    }).catch(() => {});
  };

  const handleCall = () => {
    trackClick('tel');
    if (vcard?.user?.phone) {
      window.location.href = `tel:${vcard.user.phone}`;
    }
  };

  const handleEmail = () => {
    const recipient = vcard?.user?.email;
    if (!recipient) return;

    trackClick('email');
    window.location.href = buildMailto(recipient, vcard?.user?.name || 'asesor', vcard?.user?.position);
  };

  const handleSchedule = () => {
    const recipient = vcard?.user?.email;
    if (!recipient) {
      alert('Para coordinar una cita, utiliza llamada o WhatsApp.');
      return;
    }
    trackClick('email');
    window.location.href = buildMailto(recipient, vcard.user.name, vcard.user.position, 'appointment');
  };

  const handleWhatsApp = () => {
    const rawPhone = vcard?.user?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) return;
    trackClick('wa');
    window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
  };

  if (!vcard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">vCard no encontrada</h1>
          <p className="text-gray-600">La tarjeta de contacto no pudo cargarse.</p>
        </div>
      </div>
    );
  }

  const initials = vcard?.user?.name
    ?.split(' ')
    ?.map((n: string) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? '?';

  const formattedDate = new Date(vcard?.updatedAt ?? '').toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const isThemeInWindow = (theme: VCardTheme | null | undefined) => {
    if (!theme) return false;
    const now = Date.now();
    const fromOk = !theme.validFrom || new Date(theme.validFrom).getTime() <= now;
    const toOk = !theme.validTo || new Date(theme.validTo).getTime() >= now;
    return fromOk && toOk;
  };

  const branchSeasonalTheme = vcard?.branch?.seasonalVcardTheme?.isActive && isThemeInWindow(vcard.branch.seasonalVcardTheme)
    ? vcard.branch.seasonalVcardTheme
    : null;
  const companySeasonalTheme = vcard?.branch?.company?.seasonalVcardTheme?.isActive && isThemeInWindow(vcard.branch.company.seasonalVcardTheme)
    ? vcard.branch.company.seasonalVcardTheme
    : null;

  const userPositionGroup = getPositionGroup(vcard?.user?.position);
  const roleRule = (vcard?.branch?.vcardPositionThemeRules || []).find((rule) => rule.positionGroup === userPositionGroup);
  const roleTheme = roleRule?.isEnabled && roleRule?.theme?.isActive ? roleRule.theme : null;

  const activeVCardTheme = roleTheme || branchSeasonalTheme || vcard?.branch?.vcardTheme || companySeasonalTheme || vcard?.branch?.company?.defaultVcardTheme || activeGlobalTheme || vcard?.branch?.theme;

  let themeColors: { primary?: string; secondary?: string; accent?: string } | null = null;
  if (activeVCardTheme?.isActive && activeVCardTheme?.colors) {
    try {
      themeColors = JSON.parse(activeVCardTheme.colors);
    } catch { }
  }

  const primaryColor = themeColors?.primary || vcard?.branch?.primaryColor || '#003478';
  const secondaryColor = themeColors?.secondary || vcard?.branch?.secondaryColor || '#FFFFFF';
  const accentColor = themeColors?.accent || '#10B981';
  const bgImageUrl = activeVCardTheme?.isActive && activeVCardTheme?.bgImageUrl
    ? activeVCardTheme?.bgImageUrl
    : null;
  const canvasConfig = activeVCardTheme?.config;
  const layoutConfig = Array.isArray(canvasConfig)
    ? canvasConfig
    : Array.isArray((canvasConfig as { layout?: unknown[] } | undefined)?.layout)
      ? (canvasConfig as { layout: unknown[] }).layout
      : [];

  const renderContent = () => {
    if (layoutConfig.length > 0) {
      const footerIndex = layoutConfig.findIndex((block: any) => block.type === 'Footer');
      const mainLayout = footerIndex >= 0 ? layoutConfig.slice(0, footerIndex) : layoutConfig;
      const footerLayout = footerIndex >= 0 ? layoutConfig.slice(footerIndex) : [];
      return (
        <div className="mx-auto max-w-2xl relative z-10 w-full">
          <div className="rounded-[28px] bg-white shadow-xl overflow-visible">
            {renderVCardLayout({
              layout: mainLayout,
              profile: {
                fullName: vcard.user.name,
                position: vcard.user.position,
                company: vcard.branch?.companyName || vcard.branch?.name || 'Ford Yude Canahuati',
                email: vcard.user.email,
                phone: vcard.user.phone,
                website: vcard.user.website,
                address: vcard.branch?.address,
                avatarUrl: vcard.user.photoUrl,
                logoUrl: vcard.branch?.logoUrl,
                initials,
                updatedLabel: formattedDate,
                downloadCount: vcard.downloadCount,
              },
              handlers: {
                onCall: handleCall,
                onEmail: handleEmail,
                onWhatsApp: handleWhatsApp,
                onDownload: handleDownloadVCard,
                onShare: handleShare,
                onSchedule: handleSchedule,
                onOpenUrl: (url) => {
                  if (!isSafePublicUrl(url)) return;
                  if (url.includes('wa.me/')) {
                    trackClick('wa');
                  }
                  if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
                    window.location.href = url;
                  } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                },
              },
            })}
            {footerLayout.length > 0 ? renderVCardLayout({
              layout: footerLayout,
              profile: {
                fullName: vcard.user.name,
                position: vcard.user.position,
                company: vcard.branch?.companyName || vcard.branch?.name || 'Ford Yude Canahuati',
                email: vcard.user.email,
                phone: vcard.user.phone,
                website: vcard.user.website,
                address: vcard.branch?.address,
                avatarUrl: vcard.user.photoUrl,
                logoUrl: vcard.branch?.logoUrl,
                initials,
                updatedLabel: formattedDate,
                downloadCount: vcard.downloadCount,
              },
              handlers: {
                onCall: handleCall,
                onEmail: handleEmail,
                onWhatsApp: handleWhatsApp,
                onDownload: handleDownloadVCard,
                onShare: handleShare,
                onSchedule: handleSchedule,
                onOpenUrl: (url) => {
                  if (!isSafePublicUrl(url)) return;
                  if (url.includes('wa.me/')) {
                    trackClick('wa');
                  }
                  if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
                    window.location.href = url;
                  } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                },
              },
            }) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto relative z-10 w-full">
        <div className="legacy-header rounded-t-2xl p-6 text-center">
          {vcard?.branch?.logoUrl ? (
            <div className="w-20 h-20 bg-white p-2 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <Image src={vcard.branch.logoUrl} alt="Logo" width={64} height={64} className="object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3"></div>
          )}
          <h1 className="text-white text-2xl font-bold">{vcard.user.name}</h1>
          <p className="text-white/90 text-sm">{vcard.user.position || 'Contacto'}</p>
        </div>
        <div className="bg-white rounded-b-2xl shadow-xl p-6">
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {vcard.user.phone && <button onClick={handleCall} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Phone className="w-4 h-4" /> Llamar</button>}
            {vcard.user.email && <button onClick={handleEmail} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Mail className="w-4 h-4" /> Email</button>}
            {vcard.user.phone && <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">📱 WhatsApp</button>}
            <button onClick={handleDownloadVCard} className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2"><Download className="w-4 h-4" /> Descargar</button>
            <button onClick={handleShare} className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2"><Share2 className="w-4 h-4" /> Compartir</button>
          </div>
          <div className="space-y-2 text-sm">
            {vcard.user.phone && <p className="text-gray-700">📞 {vcard.user.phone}</p>}
            {vcard.user.email && <p className="text-gray-700">✉️ {vcard.user.email}</p>}
            {vcard.branch?.address && <p className="text-gray-700">📍 {vcard.branch.address}</p>}
            {vcard.user.website && <p className="text-gray-700">🌐 {vcard.user.website}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="vcard-v2-page page-background min-h-screen px-4 py-5 sm:py-8">
      {!layoutConfig.some((block: any) => block?.type === 'Header' || block?.type === 'SeasonalHero') ? <AutomotiveBrandHero
        company={vcard.branch?.companyName || vcard.branch?.name || 'Ford Yude'}
        branch={vcard.branch?.name}
        imageUrl={bgImageUrl}
      /> : null}
      {renderContent()}
      <style jsx>{`
        .legacy-header {
          background-color: ${primaryColor};
        }

        .page-background {
          background: ${bgImageUrl ? `url(${bgImageUrl})` : `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor})`};
          background-size: cover;
          background-position: center;
        }
      `}</style>
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .vcard-v2-page *,
          .vcard-v2-page *::before,
          .vcard-v2-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
          .vcard-v2-page .vc-motion-control {
            transform: none !important;
            transition: opacity 150ms ease, background-color 150ms ease, color 150ms ease !important;
          }
        }
      `}</style>
    </div>
  );
}
