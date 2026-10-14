'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PortalGuaranteedPreview, normalizePortalThemeConfig } from '../components/portal-theme-kit';

function AccesoGarantizadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mac = searchParams.get('mac') || '';
  const branchId = searchParams.get('branchId') || '';
  const ap = searchParams.get('ap') || '';

  const [loading, setLoading] = useState(true);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    const query = ap ? `ap=${ap}` : branchId ? `branchId=${branchId}` : 'slug=default';
    Promise.all([
      fetch(`/api/public/portal-info?${query}`).then((res) => res.json()),
      mac ? fetch(`/api/portal/sessions?mac=${encodeURIComponent(mac)}`).then((res) => res.json()) : Promise.resolve({ sessions: [] }),
    ]).then(([info, sessions]) => {
      setPortalInfo(info);
      setSessionInfo(sessions.sessions?.[0] || null);
      setLoading(false);
    });
  }, [ap, branchId, mac]);

  useEffect(() => {
    if (!sessionInfo?.expiresAt) {
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(sessionInfo.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00:00:00');
        router.replace(`/portal?branchId=${branchId}${ap ? `&ap=${ap}` : ''}`);
        return;
      }

      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [ap, branchId, router, sessionInfo]);

  const config = useMemo(() => normalizePortalThemeConfig(portalInfo?.branch?.portalTheme?.config).garantizado, [portalInfo]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-[#003478]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <PortalGuaranteedPreview config={config} countdown={countdown} mac={sessionInfo?.macAddress || mac} />
        {config.showStatusCards ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sucursal</p>
              <p className="mt-2 text-lg font-black text-slate-900">{portalInfo?.branch?.name || 'General'}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Access Point</p>
              <p className="mt-2 text-lg font-black text-slate-900">{portalInfo?.accessPoint?.name || 'Default'}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Siguiente vista</p>
              <button onClick={() => router.push(`/internet?branchId=${branchId}&mac=${mac}${ap ? `&ap=${ap}` : ''}`)} className="mt-2 rounded-2xl bg-[#003478] px-4 py-2 text-sm font-black text-white">Estado internet</button>
            </div>
          </div>
        ) : null}

        {config.featureChips?.length ? (
          <div className="flex flex-wrap gap-3">
            {config.featureChips.filter(Boolean).map((chip, index) => (
              <span key={`${chip}-${index}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">{chip}</span>
            ))}
          </div>
        ) : null}

        {config.showSupportCard ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">{config.supportTitle}</p>
            <p className="mt-3 text-sm text-slate-600">{config.supportText}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function AccesoGarantizadoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-[#003478]" /></div>}>
      <AccesoGarantizadoContent />
    </Suspense>
  );
}
