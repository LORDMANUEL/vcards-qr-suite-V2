'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PortalInternetPreview, normalizePortalThemeConfig } from '../components/portal-theme-kit';

function InternetStatusContent() {
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branchId') || '';
  const ap = searchParams.get('ap') || '';
  const [loading, setLoading] = useState(true);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latency, setLatency] = useState('---');

  useEffect(() => {
    const query = ap ? `ap=${ap}` : branchId ? `branchId=${branchId}` : 'slug=default';
    fetch(`/api/public/portal-info?${query}`)
      .then((res) => res.json())
      .then((data) => setPortalInfo(data))
      .finally(() => setLoading(false));
  }, [ap, branchId]);

  useEffect(() => {
    const runCheck = async () => {
      setStatus('checking');
      const start = Date.now();
      try {
        await fetch('/api/public/portal-info?slug=default');
        setLatency(`${Date.now() - start}ms`);
        setStatus('online');
      } catch {
        setStatus('offline');
        setLatency('---');
      }
    };

    runCheck();
  }, []);

  const config = useMemo(() => normalizePortalThemeConfig(portalInfo?.branch?.portalTheme?.config).internet, [portalInfo]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-[#003478]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <PortalInternetPreview config={config} status={status} latency={latency} />
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
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Latencia actual</p>
              <p className="mt-2 text-lg font-black text-slate-900">{latency}</p>
            </div>
          </div>
        ) : null}

        {config.showQuickLinks && portalInfo?.links?.length ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{config.sectionTitleLinks}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {portalInfo.links.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 transition hover:border-[#003478] hover:bg-white">
                  {link.name}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {config.showBanners && portalInfo?.banners?.length ? (
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">{config.sectionTitleBanners}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {portalInfo.banners.map((banner: any) => (
                <a key={banner.id} href={banner.targetUrl || '#'} target="_blank" rel="noreferrer" className="overflow-hidden rounded-3xl bg-white shadow-sm">
                  <img src={banner.imageUrl} alt={banner.name} className="h-52 w-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {config.showPromotions && portalInfo?.promotions?.length ? (
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">{config.sectionTitlePromotions}</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {portalInfo.promotions.map((promo: any) => (
                <article key={promo.id} className="rounded-3xl bg-white p-5 shadow-sm">
                  {promo.imageUrl ? <img src={promo.imageUrl} alt={promo.title} className="mb-4 h-40 w-full rounded-2xl object-cover" /> : null}
                  <h4 className="text-lg font-black text-slate-900">{promo.title}</h4>
                  <p className="mt-2 text-sm text-slate-500">{promo.description}</p>
                  {promo.targetUrl ? <a href={promo.targetUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl bg-[#003478] px-4 py-2 text-sm font-bold text-white">Ver promocion</a> : null}
                </article>
              ))}
            </div>
          </section>
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

export default function InternetStatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-[#003478]" /></div>}>
      <InternetStatusContent />
    </Suspense>
  );
}
