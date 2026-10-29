'use client';

import { resolveVCardTheme } from '@/lib/vcard-theme-resolver';
import { publicVCardApiPath } from '@/lib/vcard-public-links';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Phone, Mail, MapPin, Globe, Download, Share2 } from 'lucide-react';
import { renderVCardLayout } from '../../components/vcard-theme-runtime';

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

export default function ClientVCardPage({ initialData, vCardId }: { initialData?: VCardData | null; vCardId: string }) {
  const [vcard, setVcard] = useState<VCardData['vcard'] | null>(initialData?.vcard || null);
  const [activeGlobalTheme, setActiveGlobalTheme] = useState<VCardTheme | null>(initialData?.activeGlobalTheme || null);
  const [loadingData, setLoadingData] = useState(!initialData?.vcard);
  const scanRecordedFor = useRef<string | null>(null);

  useEffect(() => {
    // Fallback: if SSR data is missing, load directly from API on client.
    if (!initialData?.vcard && vCardId) {
      (async () => {
        try {
          const response = await fetch(publicVCardApiPath(vCardId, 'profile', window.location.search), { cache: 'no-store' });
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

  // vCardId is the PUBLIC QR token. Scan.vcardId references the DATABASE ID.
  // Record only after SSR/fallback resolves a live VCard, once per loaded ID.
  useEffect(() => {
    if (!vcard?.id || scanRecordedFor.current === vcard.id) return;
    scanRecordedFor.current = vcard.id;
    void recordScan(vcard.id);
  }, [vcard?.id]);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  const recordScan = async (databaseVCardId: string) => {
    try {
      await fetch('/api/vcards/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcardId: databaseVCardId, scanMethod: new URLSearchParams(window.location.search).has('sig') ? 'QR' : 'DIRECT', sig: new URLSearchParams(window.location.search).get('sig') }),
      });
    } catch (e) {
      console.error('Error recording scan:', e);
    }
  };

  const handleDownloadVCard = async () => {
    try {
      const response = await fetch(publicVCardApiPath(vCardId, 'download', window.location.search));
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
    if (!vcard?.id) return;
    fetch('/api/vcards/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vcardId: vcard.id, actionType, sig: new URLSearchParams(window.location.search).get('sig') }),
    }).catch(() => {});
  };

  const handleCall = () => {
    trackClick('tel');
    if (vcard?.user?.phone) {
      window.location.href = `tel:${vcard.user.phone}`;
    }
  };

  const handleEmail = () => {
    trackClick('email');
    if (vcard?.user?.email) {
      window.location.href = `mailto:${vcard.user.email}`;
    }
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

  const getPositionGroup = (position?: string | null) => {
    const value = (position || '').toLowerCase();
    if (/gerente|jefe|encargad|manager|director|coordinador/.test(value)) return 'MANAGEMENT';
    if (/venta|sales|comercial/.test(value)) return 'SALES';
    if (/servicio|service|taller|advisor/.test(value)) return 'SERVICE';
    return 'OTHER';
  };

  const userPositionGroup = getPositionGroup(vcard?.user?.position);
  const roleRule = (vcard?.branch?.vcardPositionThemeRules || [])
    .find((rule) => rule.positionGroup === userPositionGroup);

  // Only published, date-eligible themes can override lower-priority defaults.
  // V1 and V2 deliberately share the exact same precedence and Honduras calendar.
  const activeVCardTheme = resolveVCardTheme({
    role: roleRule?.isEnabled ? roleRule.theme : null,
    branchSeasonal: vcard?.branch?.seasonalVcardTheme,
    branchCorporate: vcard?.branch?.vcardTheme,
    companySeasonal: vcard?.branch?.company?.seasonalVcardTheme,
    companyCorporate: vcard?.branch?.company?.defaultVcardTheme,
    global: activeGlobalTheme,
    legacy: vcard?.branch?.theme,
  });

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
                onOpenUrl: (url) => {
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
                onOpenUrl: (url) => {
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
    <div className="page-background min-h-screen py-8 px-4">
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
    </div>
  );
}
